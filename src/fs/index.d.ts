import { Shell } from "../shell";
import { Errors } from "./errors";
export interface FSStats {
	name: string;
	size: number;
	type: string;
	mime: string;
	ctime: Date | number;
	mtime: Date | number;
	atime: Date | number;
	atimeMs: number;
	ctimeMs: number;
	mtimeMs: number;
	dev: string;
	isSymbolicLink: () => boolean;
	isDirectory: () => boolean;
	isFile: () => boolean;
	uid: number;
	gid: number;
	mode: number;
}
export declare const FSConstants: {
	O_RDONLY: number;
	O_WRONLY: number;
	O_RDWR: number;
	S_IFMT: number;
	S_IFREG: number;
	S_IFDIR: number;
	S_IFCHR: number;
	S_IFBLK: number;
	S_IFIFO: number;
	S_IFLNK: number;
	S_IFSOCK: number;
	O_CREAT: number;
	O_EXCL: number;
	O_NOCTTY: number;
	O_TRUNC: number;
	O_APPEND: number;
	O_DIRECTORY: number;
	O_NOFOLLOW: number;
	O_SYNC: number;
	O_DSYNC: number;
	O_SYMLINK: number;
	O_NONBLOCK: number;
	S_IRWXU: number;
	S_IRUSR: number;
	S_IWUSR: number;
	S_IXUSR: number;
	S_IRWXG: number;
	S_IRGRP: number;
	S_IWGRP: number;
	S_IXGRP: number;
	S_IRWXO: number;
	S_IROTH: number;
	S_IWOTH: number;
	S_IXOTH: number;
	F_OK: number;
	R_OK: number;
	W_OK: number;
	X_OK: number;
	UV_FS_COPYFILE_EXCL: number;
	COPYFILE_EXCL: number;
};
export declare const fdS: unique symbol;
export type TFSFD = {
	fd: number;
	[fdS]: string;
};
export declare const updMeta: (
	handle: FileSystemDirectoryHandle,
	perms?: {
		[key: string]:
			| {
					perms: string[];
					uid: number;
					gid: number;
			  }
			| boolean;
	},
) => Promise<void>;
/**
 * The TFS File System Operations Class
 */
export declare class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;
	shell: Shell;
	perms: {
		[key: string]: {
			perms: string[];
			uid: number;
			gid: number;
		};
	};
	constants: {
		O_RDONLY: number;
		O_WRONLY: number;
		O_RDWR: number;
		S_IFMT: number;
		S_IFREG: number;
		S_IFDIR: number;
		S_IFCHR: number;
		S_IFBLK: number;
		S_IFIFO: number;
		S_IFLNK: number;
		S_IFSOCK: number;
		O_CREAT: number;
		O_EXCL: number;
		O_NOCTTY: number;
		O_TRUNC: number;
		O_APPEND: number;
		O_DIRECTORY: number;
		O_NOFOLLOW: number;
		O_SYNC: number;
		O_DSYNC: number;
		O_SYMLINK: number;
		O_NONBLOCK: number;
		S_IRWXU: number;
		S_IRUSR: number;
		S_IWUSR: number;
		S_IXUSR: number;
		S_IRWXG: number;
		S_IRGRP: number;
		S_IWGRP: number;
		S_IXGRP: number;
		S_IRWXO: number;
		S_IROTH: number;
		S_IWOTH: number;
		S_IXOTH: number;
		F_OK: number;
		R_OK: number;
		W_OK: number;
		X_OK: number;
		UV_FS_COPYFILE_EXCL: number;
		COPYFILE_EXCL: number;
	};
	errors: typeof Errors;
	constructor(handle: FileSystemDirectoryHandle);
	/**
	 * Normalizes the given path, resolving relative segments like "." and "..".
	 * If `currPath` is provided, it is used as the base for relative paths.
	 * @param path - The absolute or relative path to normalize.
	 * @param currPath - (Optional) The current working directory to resolve relative paths against.
	 * @returns The normalized absolute path as a string.
	 * @example
	 * // In this example currPath is "/home/user"
	 * tfs.fs.normalizePath("documents/file.txt") // "/home/user/documents/file.txt"
	 * tfs.fs.normalizePath("../file.txt", "/home/user/documents") // "/home/user/file.txt"
	 */
	normalizePath(path: string, currPath?: string): string;
	/**
	 * Writes data to a file at the specified path. If the file or any parent directories do not exist, they are created.
	 * @param file - The absolute or relative path to the file to write.
	 * @param content - The content to write to the file. Can be a string, ArrayBuffer, or Blob.
	 * @param type - The type of data being written: "utf8" for string, "arraybuffer" for ArrayBuffer, "blob" for Blob, or "base64" for a base64-encoded string. Defaults to "utf8".
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.writeFile("/documents/file.txt", "Hello, World!", (err) => {
	 *   if (err) throw err;
	 *   console.log("File written successfully!");
	 * });
	 *
	 * // You can also specify the type of content being written:
	 * tfs.fs.writeFile("/documents/file.txt", "Hello, World!", "utf8", (err) => {
	 *   if (err) throw err;
	 *   console.log("File written successfully!");
	 * });
	 */
	writeFile(file: string, content: string | ArrayBuffer | Blob | Uint8Array, torb?: "utf8" | "base64" | "arraybuffer" | "blob" | ((err: Error | null) => void), callback?: (err: Error | null) => void): void;
	/**
	 * Reads the contents of a file at the specified path.
	 * @param file - The absolute or relative path to the file to read.
	 * @param type - The type of data to return: "utf8" for string, "arraybuffer" for ArrayBuffer, "blob" for Blob, or "base64" for a base64-encoded string.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file data.
	 * @example
	 * tfs.fs.readFile("/documents/file.txt", "utf8", (err, data) => {
	 *   if (err) throw err;
	 *   console.log("File contents:", data);
	 * });
	 *
	 * // You can also call it without specifying the type, in which case it defaults to "utf8":
	 * tfs.fs.readFile("/documents/file.txt", (err, data) => {
	 *   if (err) throw err;
	 *   console.log("File contents:", data);
	 * });
	 */
	readFile(
		file: string,
		fTypeorcb:
			| "utf8"
			| "arraybuffer"
			| "blob"
			| "base64"
			| ((err: Error | null, data: any) => void)
			| {
					encoding: "utf8" | "arraybuffer" | "blob" | "base64";
			  },
		callback?: (err: Error | null, data: any) => void,
	): void;
	/**
	 * Creates a directory at the specified path
	 * @param dir - The absolute or relative path of the directory to create.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.mkdir("/documents/newFolder", (err) => {
	 *   if (err) throw err;
	 *   console.log("Directory created successfully!");
	 * });
	 */
	mkdir(dir: string, callback?: (err: Error | null) => void): void;
	/**
	 * Reads the contents of a directory.
	 * @param dir - The absolute or relative path of the directory to read.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the directory contents.
	 * @returns An array of file and directory names in the specified directory.
	 * @example
	 * tfs.fs.readdir("/documents", (err, files) => {
	 *   if (err) throw err;
	 *   console.log(files);
	 * });
	 */
	readdir(
		dir: string,
		optsorcb:
			| typeof callback
			| {
					recursive?: boolean;
			  },
		callback?: (err: Error | null, data: any) => void,
	): void;
	/**
	 * Retrieves information about a file or directory.
	 * @param path - The absolute or relative path of the file or directory to retrieve information for.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file/directory information.
	 * @returns An object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
	 * @example
	 * tfs.fs.stat("/documents/file.txt", (err, stats) => {
	 *   if (err) throw err;
	 *   console.log(stats);
	 * });
	 */
	stat(path: string, callback: (err: Error | null, stats?: FSStats | null) => void): void;
	/**
	 * Retrieves information about a symlink or file/directory.
	 * @param path - The absolute or relative path of the symlink or file/directory to retrieve information for.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file/directory information.
	 * @returns An object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
	 * @example
	 * tfs.fs.lstat("/documents/file.txt", (err, stats) => {
	 *   if (err) throw err;
	 *   console.log(stats);
	 * });
	 */
	lstat(path: string, callback: (err: Error | null, stats?: FSStats | null) => void): void;
	/**
	 * Appends data to a file. If the file does not exist, it is created.
	 * @param path - The absolute or relative path to the file to append data to.
	 * @param data - The data to append to the file.
	 * @param callback - The callback function to call when the operation is complete.
	 * @example
	 * tfs.fs.appendFile("/documents/file.txt", "Additional content", (err) => {
	 *   if (err) throw err;
	 *   console.log("Data appended successfully!");
	 * });
	 */
	appendFile(path: string, data: string | ArrayBuffer | ArrayBufferView, callback: (err: Error | null) => void): void;
	/**
	 * Watches for changes to a file or directory.
	 * @param path - The absolute or relative path of the file or directory to watch.
	 * @param options - Options for the watcher (e.g., recursive).
	 * @param listener - Callback function called when a change is detected.
	 * @returns An object representing the watcher.
	 * @example
	 * const watcher = tfs.fs.watch("/documents", { recursive: true }, (event, filename) => {
	 *   console.log(`Event: ${event}, File: ${filename}`);
	 *   watcher.close();
	 * });
	 *
	 * // Alternatively you can also do it this way:
	 * const watcher = tfs.fs.watch("/documents");
	 * watcher.on('change', function(event, filename) {
	 *   console.log(`Event: ${event}, File: ${filename}`);
	 *   watcher.close();
	 * });
	 */
	watch(
		path: string,
		options?: {
			recursive?: boolean;
		},
		listener?: (event: "rename" | "change", filename: string) => void,
	): {
		on: (event: "rename" | "change", cb: (event: "rename" | "change", filename: string) => void) => void;
		close: () => void;
	};
	/**
	 * Deletes a file or symlink.
	 * @param path - The absolute or relative path of the file or symlink to delete.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the deletion failed.
	 * @example
	 * tfs.fs.unlink("/documents/file.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("File deleted successfully!");
	 * });
	 */
	unlink(path: string, callback?: (err: Error | null) => void): void;
	/**
	 * Deletes an empty directory.
	 * @param path - The absolute or relative path of the directory to delete.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the deletion failed.
	 * @example
	 * tfs.fs.rmdir("/documents/oldFolder", (err) => {
	 *   if (err) throw err;
	 *   console.log("Directory deleted successfully!");
	 * });
	 */
	rmdir(
		path: string,
		optsorcb?:
			| typeof callback
			| {
					recursive?: boolean;
			  },
		callback?: (err: Error | null) => void,
	): void;
	/**
	 * Renames a file or directory.
	 * @param oldPath - The absolute or relative path of the file or directory to rename.
	 * @param newPath - The new absolute or relative path for the file or directory.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the rename failed.
	 * @example
	 * // Syntax is the same for renaming both files and directories
	 * tfs.fs.rename("/documents/oldName.txt", "/documents/newName.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("File renamed successfully!");
	 * });
	 */
	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void): void;
	/**
	 * Checks if a file or directory exists at the specified path.
	 * @param path - The absolute or relative path to check for existence.
	 * @param callback - Optional callback function called with the result. Receives true if the file/directory exists, false otherwise.
	 * @returns True if the file or directory exists, false otherwise.
	 * @example
	 * tfs.fs.exists("/documents/file.txt", (exists) => {
	 *   console.log("File exists:", exists);
	 * });
	 */
	exists(path: string, callback?: (exists: boolean) => void): void;
	/**
	 * Creates a symbolic link.
	 * @param target - The target path the symlink points to.
	 * @param path - The absolute or relative path where the symlink should be created.
	 * @param type - (Optional) The type of the symlink: "file", "dir", or "junction". Defaults to "file".
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 */
	symlink(target: string, path: string, type?: "file" | "dir" | "junction", callback?: (err: Error | null) => void): void;
	/**
	 * Checks the accessibility of a file or directory at the given path with the specified mode.
	 * @param path - The path to the file or directory to check.
	 * @param mode - The accessibility mode to check (defaults to `this.constants.F_OK`). Can be a combination of `F_OK`, `R_OK`, `W_OK`, and `X_OK`.
	 * @param callback - Optional callback function that receives an error if access is denied or the path does not exist, or `null` if access is allowed.
	 * @example
	 * tfs.fs.access("/documents/file.txt", tfs.fs.constants.R_OK | tfs.fs.constants.W_OK, (err) => {
	 *   if (err) {
	 *     console.error(`Access denied or file does not exist: ${err}`);
	 *   } else {
	 *     console.log("Access granted");
	 *   }
	 * });
	 */
	access(path: string, mode?: number, callback?: (err: Error | null) => void): void;
	/**
	 * Reads the target of a symbolic link.
	 * @param path - The absolute or relative path of the symlink to read.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the target path of the symlink.
	 * @example
	 * tfs.fs.readlink("/documents/symlink.lnk", (err, target) => {
	 *   if (err) throw err;
	 *   console.log("Symlink points to:", target);
	 * });
	 */
	readlink(path: string, callback?: (err: Error | null, target: string | null) => void): void;
	/**
	 * Creates a hard link.
	 * @param existingPath - The path to the existing file.
	 * @param newPath - The path where the hard link should be created.
	 * @param callback - Optional callback function called when the operation completes.
	 * @example
	 * tfs.fs.link("/documents/original.txt", "/documents/hardlink.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("Hard link created successfully!");
	 * });
	 */
	link(existingPath: string, newPath: string, callback?: (err: Error | null) => void): void;
	/**
	 * Copies a file from one path to another.
	 * @param oldPath - The absolute or relative path of the file to copy.
	 * @param newPath - The absolute or relative path where the file should be copied to.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.copyFile("/documents/source.txt", "/documents/destination.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("File copied successfully!");
	 * });
	 */
	copyFile(oldPath: string, newPath: string, callback?: (err: Error | null) => void): void;
	/**
	 * Copies a file or directory to a new location.
	 * @param oldPath - The absolute or relative path of the file or directory to copy.
	 * @param newPath - The absolute or relative path where the file or directory should be copied to.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.cp("/documents/sourceFolder", "/documents/destinationFolder", (err) => {
	 *   if (err) throw err;
	 *   console.log("Directory copied successfully!");
	 * });
	 */
	cp(oldPath: string, newPath: string, callback?: (err: Error | null) => void): void;
	/**
	 * Changes the permissions of a file or directory.
	 * @param path - The path to the file or directory.
	 * @param mode - The new permissions mode.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.chmod("/documents/file.txt", 0o644, (err) => {
	 *   if (err) throw err;
	 *   console.log("Permissions changed successfully!");
	 * });
	 */
	chmod(path: string, mode: number, callback?: (err: Error | null) => void): void;
	/**
	 * Changes the ownership of a file or directory.
	 * @param path - The path to the file or directory.
	 * @param uid - The new user ID.
	 * @param gid - The new group ID.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.chown("/documents/file.txt", 1000, 1000, (err) => {
	 *   if (err) throw err;
	 *   console.log("Ownership changed successfully!");
	 * });
	 */
	chown(path: string, uid: number, gid: number, callback?: (err: Error | null) => void): void;
	/**
	 * Checks if the current user has execute (x), access (a), or read (r) permissions for the given path.
	 * Returns true if any of those permissions are present, similar to NodeFS's fs.access.
	 * @param path - The path to check permissions for.
	 * @example
	 * const canExecute = tfs.fs.getxattr("/documents/file.txt");
	 * console.log("Can execute/access/read:", canExecute);
	 */
	getxattr(path: string, callback?: (canAccess: boolean) => void): false | undefined;
	/**
	 * Sets an extended attribute for the given path.
	 * @param path - The path to set the attribute for.
	 * @param value - The value of the attribute.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.setxattr("/documents/file.txt", "user.comment", (err) => {
	 *   if (err) throw err;
	 *   console.log("Attribute set successfully!");
	 * });
	 */
	setxattr(path: string, value: string, callback?: (err: Error | null) => void): void;
	/**
	 * Sets execute (x), access (a), or read (r) permission for the given path, similar to NodeFS's chmod.
	 * Adds "x" permission if not present.
	 * @param path - The path to set permissions for.
	 * @example
	 * const changed = tfs.fs.setxxr("/documents/file.txt");
	 * console.log("Permissions changed:", changed);
	 */
	setxxr(path: string, callback?: (changed: boolean) => void): false | undefined;
	promises: {
		/**
		 * Writes data to a file.
		 * @param file - The path to the file.
		 * @param content - The content to write to the file.
		 * @returns A promise that resolves when the file has been written.
		 * @example
		 * await tfs.fs.promises.writeFile("/documents/file.txt", "Hello, World!");
		 */
		writeFile: (file: string, content: string | ArrayBuffer | Blob, type?: "utf8" | "arraybuffer" | "blob" | "base64") => Promise<void>;
		/**
		 * Reads the contents of a file.
		 * @param file - The path to the file.
		 * @param type - The type of the file contents.
		 * @returns A promise that resolves with the contents of the file.
		 * @example
		 * const data = await tfs.fs.promises.readFile("/documents/file.txt", "utf8");
		 */
		readFile: (
			file: string,
			type?:
				| "utf8"
				| "arraybuffer"
				| "blob"
				| "base64"
				| {
						encoding: string;
				  },
		) => Promise<any>;
		/**
		 * Creates a new directory.
		 * @param dir - The path to the directory to create.
		 * @returns A promise that resolves when the directory has been created.
		 * @example
		 * await tfs.fs.promises.mkdir("/documents/newFolder");
		 */
		mkdir: (dir: string) => Promise<void>;
		/**
		 * Reads the contents of a directory.
		 * @param dir - The path to the directory to read.
		 * @returns A promise that resolves with an array of file names in the directory.
		 * @example
		 * const contents = await tfs.fs.promises.readdir("/documents");
		 */
		readdir: (
			dir: string,
			options?: {
				recursive?: boolean;
			},
		) => Promise<string[]>;
		/**
		 * Retrieves information about a file or directory.
		 * @param path - The absolute or relative path of the file or directory to retrieve information for.
		 * @returns A promise that resolves with an object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
		 * @example
		 * const stats = await tfs.fs.promises.stat("/documents/file.txt");
		 */
		stat: (path: string) => Promise<FSStats | null>;
		/**
		 * Retrieves information about a symlink or file/directory.
		 * @param path - The absolute or relative path of the symlink or file/directory to retrieve information for.
		 * @returns A promise that resolves with an object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
		 * @example
		 * const stats = await tfs.fs.promises.stat("/documents/file.txt");
		 */
		lstat: (path: string) => Promise<FSStats | null>;
		/**
		 * Appends data to a file. If the file does not exist, it is created.
		 * @param path - The absolute or relative path to the file to append data to.
		 * @param data - The data to append to the file.
		 * @returns A promise that resolves when the data has been appended.
		 * @example
		 * await tfs.fs.promises.appendFile("/documents/file.txt", "Additional content");
		 */
		appendFile: (path: string, data: string | ArrayBuffer | ArrayBufferView) => Promise<void>;
		/**
		 * Deletes a file or symlink.
		 * @param path - The absolute or relative path of the file or symlink to delete.
		 * @returns A promise that resolves when the file or symlink has been deleted.
		 * @example
		 * await tfs.fs.promises.unlink("/documents/file.txt");
		 */
		unlink: (path: string) => Promise<void>;
		/**
		 * Checks if a file or directory exists.
		 * @param path - The absolute or relative path of the file or directory to check.
		 * @returns A promise that resolves with a boolean indicating whether the file or directory exists.
		 * @example
		 * const exists = await tfs.fs.promises.exists("/documents/file.txt");
		 */
		exists: (path: string) => Promise<boolean>;
		/**
		 * Checks if a file or directory is accessible.
		 * @param path - The absolute or relative path of the file or directory to check.
		 * @param mode - The access mode to check (e.g., fs.constants.R_OK, fs.constants.W_OK).
		 * @returns A promise that resolves with a boolean indicating whether the file or directory is accessible.
		 * @example
		 * const canRead = await tfs.fs.promises.access("/documents/file.txt", fs.constants.R_OK);
		 */
		access: (path: string, mode: number) => Promise<unknown>;
		/**
		 * Deletes an empty directory.
		 * @param path - The absolute or relative path of the directory to delete.
		 * @returns A promise that resolves when the directory has been deleted.
		 * @example
		 * await tfs.fs.promises.rmdir("/documents/oldFolder");
		 */
		rmdir: (
			path: string,
			options?: {
				recursive?: boolean;
			},
		) => Promise<void>;
		/**
		 * Renames a file or directory.
		 * @param oldPath - The absolute or relative path of the file or directory to rename.
		 * @param newPath - The new absolute or relative path of the file or directory.
		 * @returns A promise that resolves when the file or directory has been renamed.
		 * @example
		 * await tfs.fs.promises.rename("/documents/oldFile.txt", "/documents/newFile.txt");
		 */
		rename: (oldPath: string, newPath: string) => Promise<void>;
		/**
		 * Copies a file.
		 * @param oldPath - The absolute or relative path of the file to copy.
		 * @param newPath - The new absolute or relative path of the copied file.
		 * @returns A promise that resolves when the file has been copied.
		 * @example
		 * await tfs.fs.promises.copyFile("/documents/oldFile.txt", "/documents/newFile.txt");
		 */
		copyFile: (oldPath: string, newPath: string) => Promise<void>;
		/**
		 * Creates a symbolic link.
		 * @param target - The target path the symlink points to.
		 * @param path - The absolute or relative path where the symlink should be created.
		 * @param type - (Optional) The type of the symlink: "file", "dir", or "junction". Defaults to "file".
		 * @returns A promise that resolves when the symlink has been created.
		 * @example
		 * await tfs.fs.promises.symlink("/documents/target.txt", "/documents/symlink.txt", "file");
		 */
		symlink: (target: string, path: string, type?: "file" | "dir" | "junction") => Promise<void>;
		/**
		 * Reads the target of a symbolic link.
		 * @param path - The absolute or relative path of the symlink to read.
		 * @returns A promise that resolves with the target path of the symlink.
		 * @example
		 * const target = await tfs.fs.promises.readlink("/documents/symlink.lnk");
		 */
		readlink: (path: string) => Promise<string>;
		/**
		 * Creates a hard link.
		 * @param existingPath - The path to the existing file.
		 * @param newPath - The path where the hard link should be created.
		 * @returns A promise that resolves when the hard link has been created.
		 * @example
		 * await tfs.fs.promises.link("/documents/file.txt", "/documents/file-link.txt");
		 */
		link: (existingPath: string, newPath: string) => Promise<void>;
		/**
		 * Copies a file or directory.
		 * @param oldPath - The absolute or relative path of the file or directory to copy.
		 * @param newPath - The absolute or relative path where the file or directory should be copied to.
		 * @returns A promise that resolves when the file or directory has been copied.
		 * @example
		 * await tfs.fs.promises.cp("/documents/sourceFolder", "/documents/destinationFolder");
		 */
		cp: (oldPath: string, newPath: string) => Promise<void>;
		/**
		 * Changes the ownership of a file or directory.
		 * @param path - The path to the file or directory.
		 * @param uid - The new user ID.
		 * @param gid - The new group ID.
		 * @returns A promise that resolves when the ownership has been changed.
		 * @example
		 * await tfs.fs.promises.chown("/documents/file.txt", 1000, 1000);
		 */
		chown: (path: string, uid: number, gid: number) => Promise<void>;
		/**
		 * Changes the permissions of a file or directory.
		 * @param path - The path to the file or directory.
		 * @param mode - The new permissions mode.
		 * @returns A promise that resolves when the permissions have been changed.
		 * @example
		 * await tfs.fs.promises.chmod("/documents/file.txt", 0o644);
		 */
		chmod: (path: string, mode: number) => Promise<void>;
		/**
		 * Gets an extended attribute for the given path.
		 * @param path - The path to get the attribute for.
		 * @returns A promise that resolves with the attribute value, or null if not found.
		 * @example
		 * const value = await tfs.fs.promises.getxattr("/documents/file.txt");
		 */
		getxattr: (path: string) => Promise<boolean>;
		/**
		 * Sets an extended attribute for the given path.
		 * @param path - The path to set the attribute for.
		 * @param value - The value of the attribute.
		 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
		 * @example
		 * await tfs.fs.promises.setxattr("/documents/file.txt", "user.comment");
		 */
		setxattr: (path: string, value: string) => Promise<void>;
	};
}
//# sourceMappingURL=index.d.ts.map
