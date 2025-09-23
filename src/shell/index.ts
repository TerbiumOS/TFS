import { createFSError, genError } from "../fs/errors";
import { Path } from "../path/index";
import { FS } from "../fs/index";
import { minimatch } from "minimatch";

/**
 * The TFS Shell Operations Class
 */
export class Shell {
	handle: FileSystemDirectoryHandle;
	cwd: string;
	private fs: FS;
	private path: Path;

	constructor(handle: FileSystemDirectoryHandle, fs?: FS) {
		this.handle = handle;
		this.cwd = "/";
		this.fs = fs || new FS(this.handle);
		this.path = new Path();
	}

	/**
	 * Changes the current working directory.
	 * @param path - The new directory path.
	 * @throws Will throw an error if the directory does not exist.
	 * @example
	 * tfs.shell.cd('/documents'); // Changes the current directory to '/documents'
	 */
	cd(path: string) {
		const newPath = this.path.join(this.cwd, path);
		this.fs.exists(newPath, exists => {
			if (exists) {
				this.cwd = newPath;
			} else {
				throw createFSError("ENOENT", `No such file or directory: ${newPath}`);
			}
		});
	}

	/**
	 * Prints the current working directory.
	 * @returns The current working directory as a string.
	 * @example
	 * const cwd = tfs.shell.pwd();
	 * console.log(cwd); // Returns "/" by default
	 */
	pwd() {
		return this.cwd;
	}

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
	cat(path: string | string[], callback: (error: Error | null, data: string | null) => void) {
		const paths = Array.isArray(path) ? path : [path];
		const fp = paths.map(p => this.path.join(this.cwd, p));
		let results: string[] = [];
		let completed = 0;
		if (fp.length === 0) {
			callback(genError("NotFoundError"), null);
			return;
		}
		fp.forEach((p, idx) => {
			this.fs.readFile(p, "utf8", (err: Error | null, data: string | null) => {
				if (err) {
					callback(genError(err), null);
				} else {
					results[idx] = data as string;
				}
				completed++;
				if (completed === fp.length) {
					callback(null, results.join(""));
				}
			});
		});
	}

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
	ls(path: string, callback: (error: Error | null, entries: string[] | null) => void) {
		const newPath = this.path.join(this.cwd, path);
		this.fs.readdir(newPath, (err, entries) => {
			if (err) {
				callback(genError(err), null);
			} else {
				callback(null, entries as string[]);
			}
		});
	}

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
	exec(path: string, args: any[] = [], callback: (error: Error | null, result: any) => void) {
		const scriptPath = this.path.join(this.cwd, path);
		this.fs.readFile(scriptPath, "utf8", (err: Error | null, code: string | null) => {
			if (err || !code) {
				callback(genError(err || "NotFoundError"), null);
				return;
			}
			try {
				const context = {
					fs: this.fs,
					args,
					callback,
				};
				const func = new Function("fs", "args", "callback", code);
				func(context.fs, context.args, context.callback);
			} catch (e) {
				callback(e as Error, null);
			}
		});
	}

	/**
	 * Creates a new empty file.
	 * @param path - The path to the file to create.
	 * @param callback - Callback function called with the result or error.
	 */
	touch(path: string, callback: (error: Error | null) => void) {
		const newPath = this.path.join(this.cwd, path);
		this.fs.writeFile(newPath, "", (err: Error | null) => {
			if (err) {
				callback(genError(err));
			} else {
				callback(null);
			}
		});
	}

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
	find(path: string, options: { name: string }, callback: (error: Error | null, results: string[] | null) => void) {
		const newPath = this.path.join(this.cwd, path);
		let results: string[] = [];
		let pendingDirs = 0;
		let finished = false;
		const walk = (currentPath: string) => {
			pendingDirs++;
			this.fs.readdir(currentPath, (err, entries) => {
				if (err) {
					if (!finished) {
						finished = true;
						callback(genError(err), null);
					}
					return;
				}
				let pending = (entries as string[]).length;
				if (!pending) {
					if (--pendingDirs === 0 && !finished) {
						finished = true;
						callback(null, results);
					}
					return;
				}
				(entries as string[]).forEach(entry => {
					const entryPath = this.path.join(currentPath, entry);
					this.fs.stat(entryPath, (err, stats) => {
						if (err) {
							if (!finished) {
								finished = true;
								callback(genError(err, entryPath), null);
							}
							return;
						}
						if (minimatch(entry, options.name)) {
							results.push(entryPath);
						}
						if (stats && stats.type === "directory") {
							walk(entryPath);
						}
						if (!--pending) {
							if (--pendingDirs === 0 && !finished) {
								finished = true;
								callback(null, results);
							}
						}
					});
				});
			});
		};
		walk(newPath);
	}

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
	rm(path: string, options: { recursive: boolean }, callback: (error: Error | null) => void) {
		const newPath = this.path.join(this.cwd, path);
		if (options.recursive) {
			this.fs.readdir(newPath, (err, entries) => {
				if (err) {
					callback(genError(err));
					return;
				}
				let pending = (entries as string[]).length;
				if (!pending) {
					this.fs.rmdir(newPath, err => {
						if (err) {
							callback(genError(err));
						} else {
							callback(null);
						}
					});
					return;
				}
				let errorOccurred = false;
				(entries as string[]).forEach(entry => {
					const entryPath = this.path.join(newPath, entry);
					this.fs.stat(entryPath, (err, stats) => {
						if (errorOccurred) return;
						if (err) {
							errorOccurred = true;
							callback(genError(err, entryPath));
							return;
						}
						if (stats && stats.type === "directory") {
							this.rm(this.path.join(path, entry), { recursive: true }, err => {
								if (errorOccurred) return;
								if (err) {
									errorOccurred = true;
									callback(err);
									return;
								}
								if (!--pending) {
									this.fs.rmdir(newPath, err => {
										if (err) {
											callback(genError(err));
										} else {
											callback(null);
										}
									});
								}
							});
						} else {
							this.fs.unlink(entryPath, err => {
								if (errorOccurred) return;
								if (err) {
									errorOccurred = true;
									callback(genError(err, entryPath));
									return;
								}
								if (!--pending) {
									this.fs.rmdir(newPath, err => {
										if (err) {
											callback(genError(err));
										} else {
											callback(null);
										}
									});
								}
							});
						}
					});
				});
			});
		} else {
			this.fs.unlink(newPath, err => {
				if (err) {
					callback(genError(err));
				} else {
					callback(null);
				}
			});
		}
	}

	promises = {
		/**
		 * Changes the current working directory.
		 * @param path - The path to the new working directory.
		 * @returns A promise that resolves when the directory has been changed.
		 * @example
		 * await tfs.shell.promises.cd('/documents');
		 */
		cd: (path: string): Promise<void> => {
			return new Promise(resolve => {
				this.cd(path);
				resolve();
			});
		},
		/**
		 * Reads the contents of a file.
		 * @param path - The path to the file to read.
		 * @returns A promise that resolves with the file contents as a string.
		 * @example
		 * const data = await tfs.shell.promises.cat('/documents/file.txt');
		 * console.log(data); // File Contents
		 */
		cat: (path: string): Promise<string> => {
			return new Promise((resolve, reject) => {
				this.cat(path, (err, data) => {
					if (err) {
						reject(err);
					} else {
						resolve(data as string);
					}
				});
			});
		},
		/**
		 * Lists the contents of a directory.
		 * @param path - The path to the directory to list.
		 * @returns A promise that resolves with an array of file and directory names.
		 * @example
		 * const entries = await tfs.shell.promises.ls('/documents');
		 * console.log(entries); // Array of files and directories in /documents
		 */
		ls: (path: string): Promise<string[]> => {
			return new Promise((resolve, reject) => {
				this.ls(path, (err, entries) => {
					if (err) {
						reject(err);
					} else {
						resolve(entries as string[]);
					}
				});
			});
		},
		/**
		 * Executes a command in the shell.
		 * @param path - The path to the command to execute.
		 * @param args - The arguments to pass to the command.
		 * @returns A promise that resolves with the command output.
		 * @example
		 * const result = await tfs.shell.promises.exec('/scripts/myScript.js', ['-help']);
		 * console.log(result); // Command output
		 */
		exec: (path: string, args: any[] = []): Promise<any> => {
			return new Promise((resolve, reject) => {
				this.exec(path, args, (err, result) => {
					if (err) {
						reject(err);
					} else {
						resolve(result);
					}
				});
			});
		},
		/**
		 * Creates a new empty file.
		 * @param path - The path to the file to create.
		 * @returns A promise that resolves when the file has been created.
		 * @example
		 * await tfs.shell.promises.touch('/documents/newfile.txt');
		 */
		touch: (path: string): Promise<void> => {
			return new Promise((resolve, reject) => {
				this.touch(path, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
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
		find: (path: string, options: { name: string }): Promise<string[]> => {
			return new Promise((resolve, reject) => {
				this.find(path, options, (err, results) => {
					if (err) {
						reject(err);
					} else {
						resolve(results as string[]);
					}
				});
			});
		},
		/**
		 * Removes a file or directory.
		 * @param path - The path to the file or directory to remove.
		 * @param options - The options for the removal. (Use `{ recursive: true }` to remove directories and their contents)
		 * @returns A promise that resolves when the file or directory has been removed.
		 * @example
		 * await tfs.shell.promises.rm('/documents/oldfile.txt');
		 * await tfs.shell.promises.rm('/documents/fulldir', { recursive: true });
		 */
		rm: (path: string, options?: { recursive: boolean }): Promise<void> => {
			return new Promise((resolve, reject) => {
				this.rm(path, options!, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
	};
}
