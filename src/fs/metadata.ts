import { genError } from "./errors";

export const TSD_FILE = ".TSD";
export const LEGACY_TFS_STORE_FILE = ".TFS_STORE";

export type MetadataEntry = {
	perms: string[];
	uid: number;
	gid: number;
};

export type MetadataMap = Record<string, MetadataEntry>;

export interface MetadataState {
	perms: MetadataMap;
	migratedFromLegacy: boolean;
}

type MetadataUpdate = MetadataEntry | boolean;
export type MetadataUpdates = Record<string, MetadataUpdate>;

const MAGIC = "TSD1";
const HEADER_SIZE = 12;
const MAX_RECORDS = 100_000;
const MAX_FIELD_SIZE = 16 * 1024 * 1024;
const metadataQueues = new WeakMap<FileSystemDirectoryHandle, Promise<void>>();
const metadataCache = new WeakMap<FileSystemDirectoryHandle, MetadataState>();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const MAGIC_BYTES = encoder.encode(MAGIC);
const TSD_PATH = `/${TSD_FILE}`;

const cloneEntry = (entry: MetadataEntry): MetadataEntry => ({
	perms: [...entry.perms],
	uid: entry.uid,
	gid: entry.gid,
});

const cloneState = (state: MetadataState): MetadataState => ({
	perms: Object.fromEntries(Object.entries(state.perms).map(([path, entry]) => [path, cloneEntry(entry)])),
	migratedFromLegacy: state.migratedFromLegacy,
});

const entriesEqual = (left: MetadataEntry | undefined, right: MetadataEntry): boolean => left !== undefined && left.uid === right.uid && left.gid === right.gid && left.perms.length === right.perms.length && left.perms.every((permission, index) => permission === right.perms[index]);

const defaultState = (): MetadataState => ({
	perms: {
		[TSD_PATH]: { perms: ["r"], uid: 0, gid: 0 },
	},
	migratedFromLegacy: false,
});

const isNotFound = (error: unknown) => error && typeof error === "object" && "name" in error && error.name === "NotFoundError";

const normalizeEntry = (value: unknown): MetadataEntry | null => {
	if (!value || typeof value !== "object") return null;
	const candidate = value as Partial<MetadataEntry>;
	const perms = Array.isArray(candidate.perms) ? candidate.perms.filter((perm): perm is string => typeof perm === "string") : [];
	const uid = typeof candidate.uid === "number" && Number.isFinite(candidate.uid) ? candidate.uid : 0;
	const gid = typeof candidate.gid === "number" && Number.isFinite(candidate.gid) ? candidate.gid : 0;
	return { perms, uid, gid };
};

const normalizeLegacy = (value: unknown): MetadataMap => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return {};
	const result: MetadataMap = {};
	for (const [path, entry] of Object.entries(value)) {
		if (path === `/${LEGACY_TFS_STORE_FILE}` || path === `/${TSD_FILE}`) continue;
		const normalized = normalizeEntry(entry);
		if (normalized) result[path] = normalized;
	}
	return result;
};

const readOptionalFile = async (handle: FileSystemDirectoryHandle, name: string): Promise<File | null> => {
	try {
		const fileHandle = await handle.getFileHandle(name);
		return await fileHandle.getFile();
	} catch (error) {
		if (isNotFound(error)) return null;
		throw error;
	}
};

const readLegacy = async (file: File): Promise<MetadataMap> => {
	const raw = await file.text();
	if (!raw.trim()) return {};
	try {
		return normalizeLegacy(JSON.parse(raw));
	} catch (error) {
		console.warn("[TFS.metadata] ignoring invalid legacy metadata", genError(error, LEGACY_TFS_STORE_FILE));
		return {};
	}
};

const decodeMetadata = (bytes: Uint8Array): MetadataState => {
	if (bytes.byteLength < HEADER_SIZE || decoder.decode(bytes.subarray(0, 4)) !== MAGIC) {
		throw new Error("Invalid TSD metadata header");
	}
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	const flags = view.getUint8(4);
	const recordCount = view.getUint32(8, true);
	if (recordCount > MAX_RECORDS) throw new Error("TSD metadata record limit exceeded");

	let offset = HEADER_SIZE;
	const perms: MetadataMap = {};
	const readLength = () => {
		if (offset + 4 > bytes.byteLength) throw new Error("Truncated TSD metadata record");
		const length = view.getUint32(offset, true);
		offset += 4;
		if (length > MAX_FIELD_SIZE || offset + length > bytes.byteLength) throw new Error("Invalid TSD metadata field length");
		return length;
	};

	for (let index = 0; index < recordCount; index++) {
		const pathLength = readLength();
		if (offset + 12 > bytes.byteLength) throw new Error("Truncated TSD metadata entry");
		const uid = view.getInt32(offset, true);
		offset += 4;
		const gid = view.getInt32(offset, true);
		offset += 4;
		const permCount = view.getUint32(offset, true);
		offset += 4;
		const path = decoder.decode(bytes.subarray(offset, offset + pathLength));
		offset += pathLength;
		const entryPerms: string[] = [];
		for (let permIndex = 0; permIndex < permCount; permIndex++) {
			const permLength = readLength();
			entryPerms.push(decoder.decode(bytes.subarray(offset, offset + permLength)));
			offset += permLength;
		}
		if (path && path !== `/${LEGACY_TFS_STORE_FILE}`) perms[path] = { perms: entryPerms, uid, gid };
	}

	perms[TSD_PATH] ??= { perms: ["r"], uid: 0, gid: 0 };
	return { perms, migratedFromLegacy: (flags & 1) === 1 };
};

const encodeMetadata = (state: MetadataState): Uint8Array => {
	const entries = Object.entries(state.perms).filter(([path]) => path !== `/${LEGACY_TFS_STORE_FILE}`);
	const encodedEntries = entries.map(([path, entry]) => {
		const encodedPath = encoder.encode(path);
		const encodedPerms = entry.perms.map(perm => encoder.encode(perm));
		return { path: encodedPath, perms: encodedPerms, uid: entry.uid | 0, gid: entry.gid | 0 };
	});
	const size = HEADER_SIZE + encodedEntries.reduce((total, entry) => total + 16 + entry.path.byteLength + entry.perms.reduce((permTotal, perm) => permTotal + 4 + perm.byteLength, 0), 0);
	const bytes = new Uint8Array(size);
	bytes.set(MAGIC_BYTES, 0);
	const view = new DataView(bytes.buffer);
	view.setUint8(4, state.migratedFromLegacy ? 1 : 0);
	view.setUint32(8, encodedEntries.length, true);
	let offset = HEADER_SIZE;
	for (const entry of encodedEntries) {
		view.setUint32(offset, entry.path.byteLength, true);
		offset += 4;
		view.setInt32(offset, entry.uid, true);
		offset += 4;
		view.setInt32(offset, entry.gid, true);
		offset += 4;
		view.setUint32(offset, entry.perms.length, true);
		offset += 4;
		bytes.set(entry.path, offset);
		offset += entry.path.byteLength;
		for (const perm of entry.perms) {
			view.setUint32(offset, perm.byteLength, true);
			offset += 4;
			bytes.set(perm, offset);
			offset += perm.byteLength;
		}
	}
	return bytes;
};

const writeMetadata = async (handle: FileSystemDirectoryHandle, state: MetadataState) => {
	const fileHandle = await handle.getFileHandle(TSD_FILE, { create: true });
	const writable = await fileHandle.createWritable();
	try {
		await writable.write(encodeMetadata(state).buffer as ArrayBuffer);
		await writable.close();
	} catch (error) {
		try {
			await writable.abort?.();
		} catch {
			// Keep the original write error as the operation failure.
		}
		throw error;
	}
};

const removeLegacy = async (handle: FileSystemDirectoryHandle) => {
	try {
		await handle.removeEntry(LEGACY_TFS_STORE_FILE);
	} catch (error) {
		if (!isNotFound(error)) console.warn("[TFS.metadata] migrated metadata but could not remove legacy store", genError(error, LEGACY_TFS_STORE_FILE));
	}
};

const readMetadataFromDisk = async (handle: FileSystemDirectoryHandle): Promise<MetadataState> => {
	const tsdFile = await readOptionalFile(handle, TSD_FILE);
	let state: MetadataState | null = null;
	if (tsdFile) {
		try {
			state = decodeMetadata(new Uint8Array(await tsdFile.arrayBuffer()));
		} catch (error) {
			console.warn("[TFS.metadata] rebuilding invalid TSD metadata", genError(error, TSD_FILE));
		}
	}

	const legacyFile = await readOptionalFile(handle, LEGACY_TFS_STORE_FILE);
	if (state?.migratedFromLegacy && legacyFile) {
		await removeLegacy(handle);
		return state;
	}
	if (legacyFile) {
		const legacyPerms = await readLegacy(legacyFile);
		state ??= defaultState();
		for (const [path, entry] of Object.entries(legacyPerms)) {
			if (!state.perms[path]) state.perms[path] = entry;
		}
		state.migratedFromLegacy = true;
		state.perms[TSD_PATH] ??= { perms: ["r"], uid: 0, gid: 0 };
		await writeMetadata(handle, state);
		await removeLegacy(handle);
		return state;
	}

	if (state) {
		state.perms[TSD_PATH] ??= { perms: ["r"], uid: 0, gid: 0 };
		return state;
	}

	state = defaultState();
	await writeMetadata(handle, state);
	return state;
};

const enqueue = <T>(handle: FileSystemDirectoryHandle, operation: () => Promise<T>): Promise<T> => {
	const previous = metadataQueues.get(handle) ?? Promise.resolve();
	const current = previous.catch(() => undefined).then(operation);
	metadataQueues.set(
		handle,
		current.then(
			() => undefined,
			() => undefined,
		),
	);
	return current;
};

export const initializeMetadata = (handle: FileSystemDirectoryHandle): Promise<MetadataState> =>
	enqueue(handle, async () => {
		const cached = metadataCache.get(handle);
		if (cached) return cloneState(cached);
		const state = await readMetadataFromDisk(handle);
		metadataCache.set(handle, state);
		return cloneState(state);
	});

export const updateMetadata = (handle: FileSystemDirectoryHandle, updates: MetadataUpdates = {}): Promise<void> =>
	enqueue(handle, async () => {
		const state = metadataCache.get(handle) ?? (await readMetadataFromDisk(handle));
		let changed = false;
		for (const [path, value] of Object.entries(updates)) {
			if (value === true) {
				if (path !== TSD_PATH && path in state.perms) {
					delete state.perms[path];
					changed = true;
				}
			} else if (value !== false) {
				const entry = normalizeEntry(value);
				if (entry && path !== `/${LEGACY_TFS_STORE_FILE}` && !entriesEqual(state.perms[path], entry)) {
					state.perms[path] = entry;
					changed = true;
				}
			}
		}
		const tsdEntry = { perms: ["r"], uid: 0, gid: 0 };
		if (!entriesEqual(state.perms[TSD_PATH], tsdEntry)) {
			state.perms[TSD_PATH] = tsdEntry;
			changed = true;
		}
		if (!changed) {
			metadataCache.set(handle, state);
			return;
		}
		await writeMetadata(handle, state);
		metadataCache.set(handle, state);
	});

export const resetMetadata = (handle: FileSystemDirectoryHandle): Promise<MetadataState> =>
	enqueue(handle, async () => {
		const state = defaultState();
		await writeMetadata(handle, state);
		metadataCache.set(handle, state);
		return cloneState(state);
	});

export const flushMetadata = (handle: FileSystemDirectoryHandle): Promise<void> => metadataQueues.get(handle) ?? Promise.resolve();
