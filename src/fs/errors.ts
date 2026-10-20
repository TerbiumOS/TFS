import { parse } from "stack-trace";

export enum FSErrors {
	EACCES = "permission denied",
	EBADF = "bad file descriptor",
	EBUSY = "resource busy or locked",
	EINVAL = "invalid argument",
	ENOTDIR = "not a directory",
	EISDIR = "illegal operation on a directory",
	ENOENT = "no such file or directory",
	EEXIST = "file already exists",
	EPERM = "operation not permitted",
	ELOOP = "too many symbolic links encountered",
	ENOTEMPTY = "directory not empty",
	EIO = "i/o error",
	ENOSPC = "no space left on device",
	UNKNOWN = "unknown error",
}

const errnoMap: Record<string, number> = {
	EACCES: 13,
	EBADF: 9,
	EBUSY: 16,
	EINVAL: 22,
	ENOTDIR: 20,
	EISDIR: 21,
	ENOENT: 34,
	EEXIST: 17,
	EPERM: 1,
	ELOOP: 40,
	ENOTEMPTY: 39,
	EIO: 5,
	ENOSPC: 28,
	UNKNOWN: -1,
};

/**
 * Generates an instance of a standardized TFS error.
 * @param {keyof typeof FSErrors} code The Error Code
 * @param {string} path The path of the requested File Operation
 * @param {string} errMSG The original error message (if Error type is unknown)
 */
export function createError(code: keyof typeof FSErrors, path?: string, errMSG?: string) {
	const err = new Error();
	const callsites = parse(err).slice(1);
	const lines: string[] = [`Error: ${FSErrors[code]}`];
	for (const cs of callsites) {
		const fn = (cs as any).getFunctionName?.() || (cs as any).getMethodName?.() || "<anonymous>";
		const file = (cs as any).getFileName?.();
		const line = (cs as any).getLineNumber?.();
		const col = (cs as any).getColumnNumber?.();
		if (file) {
			lines.push(`    at ${fn} (${file}:${line}:${col})`);
		} else {
			lines.push(`    at ${fn}`);
		}
	}
	if (code === "UNKNOWN" && errMSG) {
		return {
			name: "UNKNOWN",
			code: errMSG || "UNKNOWN",
			errno: -1,
			message: FSErrors[code],
			path,
			stack: lines.join("\n"),
		} as Error;
	}
	return {
		name: code,
		code,
		errno: errnoMap[code],
		message: FSErrors[code],
		path,
		stack: lines.join("\n"),
	} as Error;
}

/** Legacy name retained for consumers using the original TFS API. */
export const createFSError = createError;

/**
 * Generates an instance of FSError
 * @param {any} err The original error message
 * @param {string} path The path of the requested File Operation
 */
export function genError(err: any, path?: string) {
	const original = err;
	const name = typeof err === "string" ? err : err?.name;
	const code = typeof err === "object" ? err?.code : undefined;
	const message = typeof err === "string" ? err : err?.message;
	const reason = name === "Error" && typeof message === "string" ? message : name;
	const standardized = Object.keys(errnoMap).find(key => key === reason || key === code) as keyof typeof FSErrors | undefined;
	if (standardized) return createError(standardized, path, message);
	if (reason === "NotFoundError") return createError("ENOENT", path);
	if (reason === "TypeMismatchError") return createError("EISDIR", path);
	if (reason === "NoModificationAllowedError") return createError("EPERM", path);
	if (reason === "QuotaExceededError") return createError("ENOSPC", path);
	if (reason === "SecurityError") return createError("EACCES", path);
	if (reason === "InvalidModificationError" || reason === "PathExistsError") return createError("EEXIST", path);
	if (reason === "NotReadableError") return createError("EIO", path);
	if (reason === "DirectoryNotEmptyError") return createError("ENOTEMPTY", path);
	if (reason === "noFD") return createError("EBADF", path);
	return createError("UNKNOWN", path, message || (original == null ? undefined : String(original)));
}

/**
 * File System Errors as Functions
 * This is specifically for compatibility with legacy code that expects it such as isomorphic-git
 */
export const Errors: Record<string | number, (path?: string, errMSG?: string) => Error> = (Object.keys(FSErrors) as Array<keyof typeof FSErrors>).reduce(
	(acc, key) => {
		const fn = (path?: string, errMSG?: string) => createError(key, path, errMSG);
		acc[key] = fn;
		const num = errnoMap[key];
		if (typeof num === "number") {
			acc[num] = fn;
		}
		return acc;
	},
	{} as Record<string | number, (path?: string, errMSG?: string) => Error>,
);
