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
	UNKNOWN: -1,
};

export function createFSError(code: keyof typeof FSErrors, path?: string, stack?: string) {
	return {
		name: code,
		code,
		errno: errnoMap[code],
		message: FSErrors[code],
		path,
		stack,
	} as Error;
}
