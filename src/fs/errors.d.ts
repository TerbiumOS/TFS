export declare enum FSErrors {
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
/**
 * Generates an instance of FSError
 * @param {keyof typeof FSErrors} code The Error Code
 * @param {string} path The path of the requested File Operation
 * @param {string} errMSG The original error message (if Error type is unknown)
 */
export declare function createFSError(code: keyof typeof FSErrors, path?: string, errMSG?: string): Error;
/**
 * Generates an instance of FSError
 * @param {any} err The original error message
 * @param {string} path The path of the requested File Operation
 */
export declare function genError(err: any, path?: string): Error;
//# sourceMappingURL=errors.d.ts.map
