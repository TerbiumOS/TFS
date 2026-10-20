import { Buffer } from "buffer";
import { version } from "../package.json";
import { FS } from "./fs";
import { Errors, genError } from "./fs/errors";
import { Path } from "./path";
import { Shell } from "./shell";

export { createError, createFSError, Errors, genError } from "./fs/errors";

/**
 * The TFS File System Library
 */
export class TFS {
	handle: FileSystemDirectoryHandle;
	fs: FS;
	path: Path;
	buffer: typeof Buffer = Buffer;
	shell: Shell;
	readonly ready: Promise<void>;
	version: string = version;
	/** Polyfill for legacy applications that still expect shell as a uninitialized class */
	sh?: typeof Shell;
	Errors: typeof Errors;

	constructor(handle: FileSystemDirectoryHandle) {
		this.handle = handle;
		this.fs = new FS(this.handle);
		this.path = new Path();
		this.shell = new Shell(this.handle, this.fs);
		this.sh = Shell;
		this.Errors = Errors;
		this.ready = this.fs.ready;
	}

	/**
	 * Creates a new instance of TFS
	 * @returns {Promise<TFS>} Instance of TFS
	 */
	static async init(): Promise<TFS> {
		const handle = await navigator.storage.getDirectory();
		const tfs = new TFS(handle);
		await tfs.ready;
		return tfs;
	}

	/**
	 * Initializes TFS for use in a service worker
	 * @returns {void}
	 * @example
	 * // In your service worker file
	 * importScripts("/tfs/tfs.js");
	 * tfs.initSw();
	 * // TFS is now defined on self
	 */
	static initSw(): void {
		navigator.storage
			.getDirectory()
			.then(handle => {
				const tfs = new TFS(handle);
				return tfs.ready.then(() => {
					self.tfs = tfs;
					console.info("[TFS] ready", { version: tfs.version });
				});
			})
			.catch(error => {
				console.error("[TFS] service worker initialization failed", genError(error));
			});
	}
}

if (typeof window !== "undefined") {
	window.tfs = TFS as unknown as TFS;
}
