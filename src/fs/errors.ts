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
 * Generates an instance of FSError
 * @param {keyof typeof FSErrors} code The Error Code
 * @param {string} path The path of the requested File Operation
 * @param {string} errMSG The original error message (if Error type is unknown)
 */
export function createFSError(code: keyof typeof FSErrors, path?: string, errMSG?: string) {
	if (code === "UNKNOWN" && errMSG) {
		return {
			name: "UNKNOWN",
			code: errMSG,
			errno: -1,
			message: FSErrors[code],
			path,
		} as Error;
	}
	return {
		name: code,
		code,
		errno: errnoMap[code],
		message: FSErrors[code],
		path,
	} as Error;
}

/**
 * Generates an instance of FSError
 * @param {any} err The original error message
 * @param {string} path The path of the requested File Operation
 */
export function genError(err: any, path?: string) {
	if (err && err.name === "NotFoundError") {
		return createFSError("ENOENT", path);
	} else if (err && err.name === "TypeMismatchError") {
		return createFSError("EISDIR", path);
	} else if (err && err.name === "NoModificationAllowedError") {
		return createFSError("EPERM", path);
	} else if (err && err.name === "QuotaExceededError") {
		return createFSError("ENOSPC", path);
	} else if (err && err.name === "SecurityError") {
		return createFSError("EACCES", path);
	} else if (err && err.name === "InvalidModificationError") {
		return createFSError("EEXIST", path);
	} else if (err && err.name === "NotReadableError") {
		return createFSError("EIO", path);
	} else if (err && err.name === "DirectoryNotEmptyError") {
		return createFSError("ENOTEMPTY", path);
	} else if (err && err.name === "PathExistsError") {
		return createFSError("EEXIST", path);
	} else if (err && err.name === "noFD") {
		return createFSError("EBADF", path);
	} else {
		return createFSError("UNKNOWN", path, err && err.message);
	}
}
