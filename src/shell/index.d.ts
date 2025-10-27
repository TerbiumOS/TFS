import { FS } from "../fs/index";
/**
 * The TFS Shell Operations Class
 */
export declare class Shell {
	handle: FileSystemDirectoryHandle;
	cwd: string;
	private fs;
	private path;
	constructor(handle: FileSystemDirectoryHandle, fs?: FS);
	/**
	 * Changes the current working directory.
	 * @param path - The new directory path.
	 * @throws Will throw an error if the directory does not exist.
	 * @example
	 * tfs.shell.cd('/documents'); // Changes the current directory to '/documents'
	 */
	cd(path: string): void;
	/**
	 * Prints the current working directory.
	 * @returns The current working directory as a string.
	 * @example
	 * const cwd = tfs.shell.pwd();
	 * console.log(cwd); // Returns "/" by default
	 */
	pwd(): string;
	/**
	 * Reads the contents of a file.
	 * @param path - The path to the file to read.
	 * @param callback - Callback function called with the result.
	 * @returns The contents of the file as a string.
	 * @example
	 * tfs.shell.cat('/documents/file.txt', (err, data) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(data); // File Contents
	 * });
	 *
	 * Alternatively, you can also provide muliple files:
	 *
	 * tfs.shell.cat(['/documents/file1.txt', '/documents/file2.txt'], (err, data) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(data); // Both of the File's Contents
	 * });
	 */
	cat(path: string | string[], callback?: (error: Error | null, data: string | null) => void): void;
	/**
	 * Lists the contents of a directory.
	 * @param path - The path to the directory to list.
	 * @param callback - Callback function called with the result.
	 * @returns An array of file and directory names in the specified directory.
	 * @example
	 * // Similar usage to tfs.fs.readdir
	 * tfs.shell.ls('/documents', (err, entries) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(entries);
	 * });
	 */
	ls(path: string, callback?: (error: Error | null, entries: string[] | null) => void): void;
	/**
	 * Executes a JS File using Eval.
	 * @param path - The path to the JS file to execute.
	 * @param args - Optional args to pass to the script.
	 * @param callback - Callback function called with the result or error.
	 * @example
	 * tfs.shell.exec('/scripts/myscript.js', ['arg1', 'arg2'], (err, result) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(result); // Result from the script
	 * });
	 */
	exec(path: string, args?: any[], callback?: (error: Error | null, result: any) => void): void;
	/**
	 * Creates a new empty file.
	 * @param path - The path to the file to create.
	 * @param callback - Callback function called with the result or error.
	 * @example
	 * tfs.shell.touch('/documents/newfile.txt', (err) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log('File created');
	 * });
	 */
	touch(path: string, callback?: (error: Error | null) => void): void;
	/**
	 * Finds files in a directory.
	 * @param path - The path to the directory to search.
	 * @param options - Options for the search.
	 * @param callback - Callback function called with the results or error.
	 * @returns An array of file paths that match the search criteria.
	 * @example
	 * tfs.shell.find('/documents', { name: '*.txt' }, (err, results) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(results); // Array of .txt files and directories in /documents
	 * });
	 *
	 * You can also use other glob patterns:
	 *
	 * tfs.shell.find('/documents', { name: 'file?.js' }, (err, results) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(results); // Array of files and directories in /documents
	 * });
	 */
	find(
		path: string,
		options: {
			name: string;
		},
		callback?: (error: Error | null, results: string[] | null) => void,
	): void;
	/**
	 * Removes a file or directory.
	 * @param path - The path to the file or directory to remove.
	 * @param options - Options for the removal.
	 * @param callback - Callback function called with the result or error.
	 * @example
	 * tfs.shell.rm('/documents/oldfile.txt', {}, (err) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log('File removed');
	 * });
	 *
	 * To remove directories and their contents, use the recursive option:
	 *
	 * tfs.shell.rm('/documents/fulldir', { recursive: true }, (err) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log('Directory and its contents are deleted');
	 * });
	 */
	rm(
		path: string,
		options: {
			recursive: boolean;
		},
		callback?: (error: Error | null) => void,
	): void;
	/**
	 * Creates a directory and any necessary parent directories.
	 * @param path - The path to the directory to create.
	 * @param callback - Callback function called with the result or error.
	 * @example
	 * tfs.shell.mkdirp('/documents/newdir/subdir', (err) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log('Directories created');
	 * });
	 */
	mkdirp(path: string, callback?: (error: Error | null) => void): void;
	/**
	 * Creates a temporary directory.
	 * @param callback - Callback function called with the result or error.
	 * @example
	 * tfs.shell.tempDir((err, dirPath) => {
	 *   if (err) {
	 *     console.error(err);
	 *   }
	 *   console.log(dirPath);
	 * });
	 */
	tempDir(callback?: (error: Error | null, dirPath?: string) => void): void;
	/**
	 * Formats the File System (Deletes all files and directories).
	 * NOTE this is not reversible and should be used with caution.
	 * Also note that this is not in the Filer or NodeFS spec and is a TFS Specific method.
	 * @example
	 * await tfs.shell.format();
	 */
	format(): Promise<void>;
	promises: {
		/**
		 * Changes the current working directory.
		 * @param path - The path to the new working directory.
		 * @returns A promise that resolves when the directory has been changed.
		 * @example
		 * await tfs.shell.promises.cd('/documents');
		 */
		cd: (path: string) => Promise<void>;
		/**
		 * Reads the contents of a file.
		 * @param path - The path to the file to read.
		 * @returns A promise that resolves with the file contents as a string.
		 * @example
		 * const data = await tfs.shell.promises.cat('/documents/file.txt');
		 * console.log(data); // File Contents
		 */
		cat: (path: string) => Promise<string>;
		/**
		 * Lists the contents of a directory.
		 * @param path - The path to the directory to list.
		 * @returns A promise that resolves with an array of file and directory names.
		 * @example
		 * const entries = await tfs.shell.promises.ls('/documents');
		 * console.log(entries); // Array of files and directories in /documents
		 */
		ls: (path: string) => Promise<string[]>;
		/**
		 * Executes a command in the shell.
		 * @param path - The path to the command to execute.
		 * @param args - The arguments to pass to the command.
		 * @returns A promise that resolves with the command output.
		 * @example
		 * const result = await tfs.shell.promises.exec('/scripts/myScript.js', ['-help']);
		 * console.log(result); // Command output
		 */
		exec: (path: string, args?: any[]) => Promise<any>;
		/**
		 * Creates a new empty file.
		 * @param path - The path to the file to create.
		 * @returns A promise that resolves when the file has been created.
		 * @example
		 * await tfs.shell.promises.touch('/documents/newfile.txt');
		 */
		touch: (path: string) => Promise<void>;
		/**
		 * Finds files in a directory.
		 * @param path - The path to the directory to search.
		 * @param options - The search options.
		 * @returns A promise that resolves with an array of matching file paths.
		 * @example
		 * const results = await tfs.shell.promises.find('/documents', { name: '*.txt' });
		 * console.log(results); // Array of .txt files and directories in /documents
		 *
		 * You can also use other glob patterns:
		 *
		 * const results = await tfs.shell.promises.find('/documents', { name: 'file?.js' });
		 * console.log(results); // Array of files and directories in /documents
		 */
		find: (
			path: string,
			options: {
				name: string;
			},
		) => Promise<string[]>;
		/**
		 * Removes a file or directory.
		 * @param path - The path to the file or directory to remove.
		 * @param options - The options for the removal. (Use `{ recursive: true }` to remove directories and their contents)
		 * @returns A promise that resolves when the file or directory has been removed.
		 * @example
		 * await tfs.shell.promises.rm('/documents/oldfile.txt');
		 * await tfs.shell.promises.rm('/documents/fulldir', { recursive: true });
		 */
		rm: (
			path: string,
			options?: {
				recursive: boolean;
			},
		) => Promise<void>;
		/**
		 * Creates a directory and any necessary parent directories.
		 * @param path - The path to the directory to create.
		 * @returns A promise that resolves when the directory has been created.
		 * @example
		 * await tfs.shell.promises.mkdirp('/documents/newdir/subdir');
		 */
		mkdirp: (path: string) => Promise<void>;
		/**
		 * Creates a temporary directory.
		 * @returns A promise that resolves with the path of the created temporary directory.
		 * @example
		 * const dirPath = await tfs.shell.promises.tempDir();
		 * console.log(dirPath); // Path of the created temporary directory
		 */
		tempDir: () => Promise<string>;
	};
}
//# sourceMappingURL=index.d.ts.map
