import { Shell } from "../shell";
import { genError } from "./errors";

/**
 * The TFS File System Operations Class
 */
export class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;
	shell: Shell;

	constructor(handle: FileSystemDirectoryHandle) {
		this.handle = handle;
		this.currPath = "/";
		this.shell = new Shell(this.handle, this);
	}

	/**
	 * Normalizes the given path, resolving relative segments like "." and "..".
	 * If `currPath` is provided, it is used as the base for relative paths.
	 * @param path - The absolute or relative path to normalize.
	 * @param currPath - (Optional) The current working directory to resolve relative paths against.
	 * @returns The normalized absolute path as a string.
	 */
	normalizePath(path: string, currPath?: string): string {
		if (currPath) this.currPath = currPath;
		if (!path) return this.currPath;
		if (!path.startsWith("/")) path = this.currPath + "/" + path;

		const parts = path.split("/").filter(Boolean);
		const stack: string[] = [];

		for (const part of parts) {
			if (part === "." || part === "") continue;
			if (part === "..") {
				if (stack.length > 0) stack.pop();
			} else {
				stack.push(part);
			}
		}

		let newPath = "/" + stack.join("/");
		if (newPath === "//") newPath = "/";

		return newPath;
	}

	/**
	 * Writes data to a file at the specified path. If the file or any parent directories do not exist, they are created.
	 * @param file - The absolute or relative path to the file to write.
	 * @param content - The content to write to the file. Can be a string, ArrayBuffer, or Blob.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 */
	writeFile(file: string, content: string | ArrayBuffer | Blob, callback?: (err: Error | null) => void) {
		const normalizedPath = this.normalizePath(file);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);

		for (let i = 0; i < parts.length - 1; i++) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(parts[i] as string, { create: true }));
		}

		const fileName = parts[parts.length - 1];
		dirPromise
			.then(dirHandle => dirHandle.getFileHandle(fileName as string, { create: true }))
			.then(fileHandle => fileHandle.createWritable())
			.then(writable => writable.write(content).then(() => writable.close()))
			.then(() => {
				if (callback) callback(null);
			})
			.catch(err => {
				if (callback) callback(genError(err, normalizedPath));
			});
	}

	/**
	 * Reads the contents of a file at the specified path.
	 * @param file - The absolute or relative path to the file to read.
	 * @param type - The type of data to return: "utf8" for string, "arraybuffer" for ArrayBuffer, "blob" for Blob, or "base64" for a base64-encoded string.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file data.
	 */
	readFile(file: string, type: "utf8" | "arraybuffer" | "blob" | "base64", callback: (err: Error | null, data: any) => void) {
		const normalizedPath = this.normalizePath(file);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise: Promise<FileSystemDirectoryHandle> = Promise.resolve(this.handle);
		for (let i = 0; i < parts.length - 1; i++) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(parts[i] as string));
		}
		const fileName = parts[parts.length - 1];
		dirPromise
			.then(dirHandle => dirHandle.getFileHandle(fileName as string))
			.then(fileHandle => fileHandle.getFile())
			.then(file => {
				if (type === "arraybuffer") {
					return file.arrayBuffer().then(data => callback(null, data));
				} else if (type === "blob") {
					callback(null, file);
					return;
				} else if (type === "base64") {
					const reader = new FileReader();
					reader.onload = () => {
						callback(null, reader.result);
					};
					reader.readAsDataURL(file);
					return;
				}
				file.text().then(data => callback(null, data));
			})
			.catch(err => {
				callback(genError(err, file), null);
			});
	}

	/**
	 * Creates a directory at the specified path
	 * @param dir - The absolute or relative path of the directory to create.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 */
	mkdir(dir: string, callback?: (err: Error | null) => void) {
		const normalizedPath = this.normalizePath(dir);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);

		for (const part of parts) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(part, { create: true }));
		}
		if (callback) {
			dirPromise
				.then(() => callback(null))
				.catch(err => {
					callback(genError(err, dir));
				});
		}
	}

	/**
	 * Reads the contents of a directory.
	 * @param dir - The absolute or relative path of the directory to read.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the directory contents.
	 * @returns An array of file and directory names in the specified directory.
	 */
	readdir(dir: string, callback: (err: Error | null, data: any) => void) {
		const normalizedPath = this.normalizePath(dir);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);

		for (const part of parts) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(part));
		}

		dirPromise
			.then(dirHandle => {
				const entries: string[] = [];
				const ent = dirHandle.entries();
				function next() {
					ent.next()
						.then(result => {
							if (result.done) {
								callback(null, entries);
							} else {
								const [name] = result.value;
								entries.push(name);
								next();
							}
						})
						.catch(err => {
							callback(genError(err, dir), null);
						});
				}
				next();
			})
			.catch(err => {
				callback(genError(err, dir), null);
			});
	}

	/**
	 * Retrieves information about a file or directory.
	 * @param path - The absolute or relative path of the file or directory to retrieve information for.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file/directory information.
	 * @returns An object containing the name, size, mime type of the file or just as directory, and lastModified timestamp.
	 */
	stat(path: string, callback: (err: Error | null, stats?: { name: string; size: number; type: string; lastModified: number } | null) => void) {
		const normalizedPath = this.normalizePath(path);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);
		for (let i = 0; i < parts.length - 1; i++) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(parts[i] as string));
		}
		const lastPart = parts[parts.length - 1];
		dirPromise
			.then(dirHandle =>
				dirHandle
					.getFileHandle(lastPart as string)
					.then(fileHandle =>
						fileHandle.getFile().then(file =>
							callback(null, {
								name: file.name,
								size: file.size,
								type: file.type,
								lastModified: file.lastModified,
							}),
						),
					)
					.catch(err => {
						if (err && err.name === "NotFoundError") {
							dirHandle
								.getDirectoryHandle(lastPart as string)
								.then(() =>
									callback(null, {
										name: lastPart as string,
										size: 0,
										type: "directory",
										lastModified: 0,
									}),
								)
								.catch(dirErr => {
									callback(genError(dirErr, path), null);
								});
						} else if (err && err.name === "TypeMismatchError") {
							dirHandle
								.getDirectoryHandle(lastPart as string)
								.then(() =>
									callback(null, {
										name: lastPart as string,
										size: 0,
										type: "directory",
										lastModified: 0,
									}),
								)
								.catch(dirErr => {
									callback(genError(dirErr, path), null);
								});
						} else {
							callback(genError(err, path), null);
						}
					}),
			)
			.catch(err => {
				callback(genError(err, path), null);
			});
	}

	/**
	 * Retrieves information about a symlink or file/directory.
	 * @param path - The absolute or relative path of the symlink or file/directory to retrieve information for.
	 * @param callback - Callback function called with the result. Receives an error (or null) and the file/directory information.
	 * @returns An object containing the name, size, mime type of the file or just as directory, and lastModified timestamp.
	 */
	lstat(path: string, callback: (err: Error | null, stats?: { name: string; size: number; type: string; lastModified: number } | null) => void) {
		this.stat(path, callback);
	}

	/**
	 * Watches for changes to a file or directory.
	 * @param path - The absolute or relative path of the file or directory to watch.
	 * @param options - Options for the watcher (e.g., recursive).
	 * @param listener - Callback function called when a change is detected.
	 * @returns An object representing the watcher.
	 */
	watch(path: string, options?: { recursive?: boolean }, listener?: (event: "rename" | "change", filename: string) => void) {
		const normalizedPath = this.normalizePath(path);
		let closed = false;
		let prevSnapshot: Map<string, { size: number; lastModified: number; type: string }> = new Map();
		const EventEmitter = class {
			private listeners: { [event in "rename" | "change"]?: Array<(event: "rename" | "change", filename: string) => void> } = {};
			on(event: "rename" | "change", cb: (event: "rename" | "change", filename: string) => void) {
				if (!this.listeners[event]) this.listeners[event] = [];
				this.listeners[event]!.push(cb);
			}
			emit(event: "rename" | "change", filename: string) {
				if (this.listeners[event]) {
					for (const cb of this.listeners[event]!) cb(event, filename);
				}
			}
			removeAllListeners() {
				this.listeners = {};
			}
		};
		const emitter = new EventEmitter();
		if (listener) {
			emitter.on("change", listener);
			emitter.on("rename", listener);
		}
		const scan = async () => {
			if (closed) return;
			const snapshot = new Map<string, { size: number; lastModified: number; type: string }>();
			const walk = async (dir: string) => {
				const entries: string[] = await this.promises.readdir(dir).catch(() => []);
				for (const entry of entries) {
					const fullPath = this.normalizePath(dir + "/" + entry);
					const stat = await this.promises.stat(fullPath).catch(() => null);
					if (stat) {
						snapshot.set(fullPath, { size: stat.size, lastModified: stat.lastModified, type: stat.type });
						if (options?.recursive && stat.type === "directory") {
							await walk(fullPath);
						}
					}
				}
			};
			const stat = await this.promises.stat(normalizedPath).catch(() => null);
			if (stat) {
				snapshot.set(normalizedPath, { size: stat.size, lastModified: stat.lastModified, type: stat.type });
				if (options?.recursive && stat.type === "directory") {
					await walk(normalizedPath);
				}
			}
			for (const [file, info] of snapshot) {
				if (!prevSnapshot.has(file)) {
					emitter.emit("rename", file);
				} else {
					const prev = prevSnapshot.get(file)!;
					if (info.size !== prev.size || info.lastModified !== prev.lastModified) {
						emitter.emit("change", file);
					}
				}
			}
			for (const file of prevSnapshot.keys()) {
				if (!snapshot.has(file)) {
					emitter.emit("rename", file);
				}
			}
			prevSnapshot = snapshot;
		};
		let interval: any = setInterval(scan, 500);
		const watcher = {
			on: (event: "rename" | "change", cb: (event: "rename" | "change", filename: string) => void) => {
				emitter.on(event, cb);
			},
			close: () => {
				closed = true;
				clearInterval(interval);
				emitter.removeAllListeners();
			},
		};
		scan();
		return watcher;
	}

	/**
	 * Deletes a file.
	 * @param path - The absolute or relative path of the file to delete.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the deletion failed.
	 */
	unlink(path: string, callback?: (err: Error | null) => void) {
		const normalizedPath = this.normalizePath(path);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise: Promise<FileSystemDirectoryHandle> = Promise.resolve(this.handle);
		for (let i = 0; i < parts.length - 1; i++) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(parts[i] as string));
		}
		const fileName = parts[parts.length - 1];
		dirPromise
			.then(dirHandle => {
				return dirHandle.removeEntry(fileName as string);
			})
			.then(() => {
				if (callback) callback(null);
			})
			.catch(err => {
				if (callback) callback(genError(err, path));
			});
	}

	/**
	 * Deletes an empty directory.
	 * @param path - The absolute or relative path of the directory to delete.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the deletion failed.
	 */
	rmdir(path: string, callback?: (err: Error | null) => void) {
		const normalizedPath = this.normalizePath(path);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise: Promise<FileSystemDirectoryHandle> = Promise.resolve(this.handle);
		for (let i = 0; i < parts.length - 1; i++) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(parts[i] as string));
		}
		const dirName = parts[parts.length - 1];
		dirPromise
			.then(dirHandle => {
				return dirHandle.removeEntry(dirName as string);
			})
			.then(() => {
				if (callback) callback(null);
			})
			.catch(err => {
				if (callback) callback(genError(err, path));
			});
	}

	/**
	 * Renames a file or directory.
	 * @param oldPath - The absolute or relative path of the file or directory to rename.
	 * @param newPath - The new absolute or relative path for the file or directory.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the rename failed.
	 */
	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		const oldP = this.normalizePath(oldPath);
		const newP = this.normalizePath(newPath);
		this.stat(oldP, (err, stats) => {
			if (err || !stats) {
				if (callback) callback(genError(err, oldP));
				return;
			}
			if (stats.type === "directory") {
				this.mkdir(newP, err => {
					if (err) {
						if (callback) callback(genError(err, newP));
					} else {
						this.readdir(oldP, (err, entries) => {
							if (err) {
								if (callback) callback(genError(err, oldP));
							} else {
								// TODO: Make this recursively delete the dir if its not empty
								Promise.all(entries.map((entry: string) => this.promises.rename(oldP + "/" + entry, newP + "/" + entry)))
									.then(() => this.promises.rmdir(oldP))
									.then(() => {
										if (callback) callback(null);
									})
									.catch(err => {
										if (callback) callback(genError(err, oldPath));
									});
							}
						});
					}
				});
			} else {
				return this.copyFile(oldP, newP, err => {
					if (err) {
						if (callback) callback(genError(err, oldPath));
					} else {
						if (callback) callback(null);
						this.unlink(oldP);
					}
				});
			}
		});
	}

	/**
	 * Checks if a file or directory exists at the specified path.
	 * @param path - The absolute or relative path to check for existence.
	 * @param callback - Optional callback function called with the result. Receives true if the file/directory exists, false otherwise.
	 * @returns True if the file or directory exists, false otherwise.
	 */
	exists(path: string, callback?: (exists: boolean) => void) {
		const normalizedPath = this.normalizePath(path);
		this.stat(normalizedPath, (err, _) => {
			if (err) {
				if (callback) callback(false);
			} else {
				if (callback) callback(true);
			}
		});
	}

	/**
	 * Copies a file from one path to another.
	 * @param oldPath - The absolute or relative path of the file to copy.
	 * @param newPath - The absolute or relative path where the file should be copied to.
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 */
	copyFile(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		const oldP = this.normalizePath(oldPath);
		const newP = this.normalizePath(newPath);
		this.readFile(oldP, "arraybuffer", (err, data) => {
			if (err) genError(err, oldP);
			this.writeFile(newP, data, callback);
		});
	}

	promises = {
		writeFile: (file: string, content: string | ArrayBuffer | Blob) => {
			return new Promise<void>(resolve => {
				this.writeFile(file, content);
				resolve();
			});
		},
		readFile: (file: string, type: "utf8" | "arraybuffer" | "blob") => {
			return new Promise<any>((resolve, reject) => {
				this.readFile(file, type, (err: Error | null, data: any) => {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			});
		},
		mkdir: (dir: string) => {
			return new Promise<void>(resolve => {
				this.mkdir(dir);
				resolve();
			});
		},
		readdir: (dir: string) => {
			return new Promise<string[]>((resolve, reject) => {
				this.readdir(dir, (err, files) => {
					if (err) {
						reject(err);
					} else {
						resolve(files);
					}
				});
			});
		},
		stat: (path: string) => {
			return new Promise<{ name: string; size: number; type: string; lastModified: number } | null>((resolve, reject) => {
				this.stat(path, (err, stats) => {
					if (err) {
						reject(err);
					} else {
						resolve(stats!);
					}
				});
			});
		},
		lstat: (path: string) => {
			return new Promise<{ name: string; size: number; type: string; lastModified: number } | null>((resolve, reject) => {
				this.lstat(path, (err, stats) => {
					if (err) {
						reject(err);
					} else {
						resolve(stats!);
					}
				});
			});
		},
		unlink: (path: string) => {
			return new Promise<void>((resolve, reject) => {
				this.unlink(path, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		exists: (path: string) => {
			return new Promise<boolean>(resolve => {
				this.exists(path, exists => {
					resolve(exists);
				});
			});
		},
		rmdir: (path: string) => {
			return new Promise<void>((resolve, reject) => {
				this.rmdir(path, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		rename: (oldPath: string, newPath: string) => {
			return new Promise<void>((resolve, reject) => {
				this.rename(oldPath, newPath, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		copyFile: (oldPath: string, newPath: string) => {
			return new Promise<void>((resolve, reject) => {
				this.copyFile(oldPath, newPath, err => {
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
