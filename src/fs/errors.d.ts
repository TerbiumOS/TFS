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
	UNKNOWN = "unknown error",
}
export declare function createFSError(code: keyof typeof FSErrors, path?: string, stack?: string): Error;
//# sourceMappingURL=errors.d.ts.map
