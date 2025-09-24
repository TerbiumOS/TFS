import { Shell } from "../shell";
interface FSStats {
	name: string;
	size: number;
	type: string;
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
}
/**
 * The TFS File System Operations Class
 */
export declare class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;
	shell: Shell;
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
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 * @example
	 * tfs.fs.writeFile("/documents/file.txt", "Hello, World!", (err) => {
	 *   if (err) throw err;
	 *   console.log("File written successfully!");
	 * });
	 */
	writeFile(file: string, content: string | ArrayBuffer | Blob, callback?: (err: Error | null) => void): void;
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
	 */
	readFile(file: string, type: "utf8" | "arraybuffer" | "blob" | "base64", callback: (err: Error | null, data: any) => void): void;
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
	readdir(dir: string, callback: (err: Error | null, data: any) => void): void;
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
	rmdir(path: string, callback?: (err: Error | null) => void): void;
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
	promises: {
		/**
		 * Writes data to a file.
		 * @param file - The path to the file.
		 * @param content - The content to write to the file.
		 * @returns A promise that resolves when the file has been written.
		 * @example
		 * await tfs.fs.promises.writeFile("/documents/file.txt", "Hello, World!");
		 */
		writeFile: (file: string, content: string | ArrayBuffer | Blob) => Promise<void>;
		/**
		 * Reads the contents of a file.
		 * @param file - The path to the file.
		 * @param type - The type of the file contents.
		 * @returns A promise that resolves with the contents of the file.
		 * @example
		 * const data = await tfs.fs.promises.readFile("/documents/file.txt", "utf8");
		 */
		readFile: (file: string, type: "utf8" | "arraybuffer" | "blob") => Promise<any>;
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
		readdir: (dir: string) => Promise<string[]>;
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
		 * Deletes an empty directory.
		 * @param path - The absolute or relative path of the directory to delete.
		 * @returns A promise that resolves when the directory has been deleted.
		 * @example
		 * await tfs.fs.promises.rmdir("/documents/oldFolder");
		 */
		rmdir: (path: string) => Promise<void>;
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
		 * Copies a file or directory.
		 * @param oldPath - The absolute or relative path of the file or directory to copy.
		 * @param newPath - The absolute or relative path where the file or directory should be copied to.
		 * @returns A promise that resolves when the file or directory has been copied.
		 * @example
		 * await tfs.fs.promises.cp("/documents/sourceFolder", "/documents/destinationFolder");
		 */
		cp: (oldPath: string, newPath: string) => Promise<void>;
	};
}
export {};
//# sourceMappingURL=index.d.ts.map
