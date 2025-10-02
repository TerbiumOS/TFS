import { Shell } from "../shell";
import { genError } from "./errors";

interface FSStats {
	name: string;
	size: number;
	type: string;
	// Non-Standard but should be included
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
}

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
	 * @example
	 * // In this example currPath is "/home/user"
	 * tfs.fs.normalizePath("documents/file.txt") // "/home/user/documents/file.txt"
	 * tfs.fs.normalizePath("../file.txt", "/home/user/documents") // "/home/user/file.txt"
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
	writeFile(file: string, content: string | ArrayBuffer | Blob | Uint8Array, torb?: "utf8" | "base64" | "arraybuffer" | "blob" | ((err: Error | null) => void), callback?: (err: Error | null) => void) {
		let encoding: "utf8" | "base64" | "arraybuffer" | "blob" = "utf8";
		let cb: (err: Error | null) => void;
		if (typeof torb === "function") {
			cb = torb;
		} else {
			encoding = torb || "utf8";
			cb = callback!;
		}
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
			.then(async writable => {
				let toWrite: string | ArrayBuffer | Blob | ArrayBufferLike | BlobPart[];
				if (!torb || typeof torb === "function") {
					if (typeof content === "string") {
						toWrite = content;
						encoding = "utf8";
					} else if (content instanceof ArrayBuffer) {
						toWrite = content;
						encoding = "arraybuffer";
					} else if (content instanceof Uint8Array) {
						toWrite = content.buffer;
						encoding = "arraybuffer";
					} else if (content instanceof Blob) {
						toWrite = content;
						encoding = "blob";
					} else {
						toWrite = String(content);
						encoding = "utf8";
					}
				} else {
					switch (encoding) {
						case "arraybuffer":
							if (typeof content === "string") {
								toWrite = new TextEncoder().encode(content).buffer;
							} else if (content instanceof ArrayBuffer) {
								toWrite = content;
							} else if (content instanceof Uint8Array) {
								toWrite = content.buffer;
							} else if (content instanceof Blob) {
								toWrite = await content.arrayBuffer();
							} else {
								toWrite = new ArrayBuffer(0);
							}
							break;
						case "blob":
							if (content instanceof Blob) {
								toWrite = content;
							} else if (typeof content === "string" || content instanceof ArrayBuffer || content instanceof Uint8Array) {
								// @ts-expect-error
								toWrite = new Blob([content]);
							} else {
								toWrite = new Blob([]);
							}
							break;
						case "base64":
							if (typeof content === "string") {
								const binary = atob(content);
								const len = binary.length;
								const bytes = new Uint8Array(len);
								for (let i = 0; i < len; i++) {
									bytes[i] = binary.charCodeAt(i);
								}
								toWrite = bytes.buffer;
							} else if (content instanceof ArrayBuffer) {
								toWrite = content;
							} else if (content instanceof Uint8Array) {
								toWrite = content.buffer;
							} else if (content instanceof Blob) {
								toWrite = await content.arrayBuffer();
							} else {
								toWrite = new ArrayBuffer(0);
							}
							break;
						case "utf8":
						default:
							if (typeof content === "string") {
								toWrite = content;
							} else if (content instanceof ArrayBuffer) {
								toWrite = new TextDecoder().decode(content);
							} else if (content instanceof Uint8Array) {
								toWrite = new TextDecoder().decode(content);
							} else if (content instanceof Blob) {
								toWrite = await content.text();
							} else {
								toWrite = String(content);
							}
					}
				}
				// @ts-expect-error
				await writable.write(toWrite);
				await writable.close();
			})
			.then(() => {
				if (cb) cb(null);
			})
			.catch(err => {
				if (cb) cb(genError(err, normalizedPath));
			});
	}

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
	readFile(file: string, fTypeorcb: "utf8" | "arraybuffer" | "blob" | "base64" | ((err: Error | null, data: any) => void), callback?: (err: Error | null, data: any) => void) {
		let type: "utf8" | "arraybuffer" | "blob" | "base64" = "utf8";
		let cb: (err: Error | null, data: any) => void;
		if (typeof fTypeorcb === "string") {
			type = fTypeorcb;
			cb = callback!;
		} else {
			cb = fTypeorcb;
		}
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
				file.text()
					.then(text => {
						const isSymlink = /^symlink:(.+?):(file|dir|junction)$/.exec(text);
						if (isSymlink) {
							const target = isSymlink[1];
							const linkType = isSymlink[2];
							if (linkType === "file") {
								this.readFile(target as string, type, cb);
							} else {
								cb(genError(new Error("TypeMismatchError"), file.name), null);
							}
							return;
						}
						if (type === "arraybuffer") {
							file.arrayBuffer().then(data => cb(null, data));
						} else if (type === "blob") {
							cb(null, file);
						} else if (type === "base64") {
							const reader = new FileReader();
							reader.onload = () => {
								cb(null, reader.result);
							};
							reader.readAsDataURL(file);
						} else {
							cb(null, text);
						}
					})
					.catch(err => {
						cb(genError(err, file.name), null);
					});
			})
			.catch(err => {
				cb(genError(err, file), null);
			});
	}

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
	 * @example
	 * tfs.fs.readdir("/documents", (err, files) => {
	 *   if (err) throw err;
	 *   console.log(files);
	 * });
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
	 * @returns An object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
	 * @example
	 * tfs.fs.stat("/documents/file.txt", (err, stats) => {
	 *   if (err) throw err;
	 *   console.log(stats);
	 * });
	 */
	stat(path: string, callback: (err: Error | null, stats?: FSStats | null) => void) {
		const normalizedPath = this.normalizePath(path);
		if (normalizedPath === "/") {
			callback(null, {
				name: "/",
				size: 0,
				mime: "DIRECTORY",
				type: "DIRECTORY",
				ctime: 0,
				mtime: 0,
				atime: 0,
				atimeMs: 0,
				ctimeMs: 0,
				mtimeMs: 0,
				dev: "OPFS",
				isSymbolicLink: () => false,
				isDirectory: () => true,
				isFile: () => false,
				uid: 0,
				gid: 0,
			});
			return;
		}
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
							file.text().then(text => {
								const isSymlink = /^symlink:(.+?):(file|dir|junction)$/.exec(text);
								if (isSymlink) {
									const target = isSymlink[1];
									this.stat(target as string, (err, stats) => {
										if (err) {
											callback(genError(err, target), null);
										} else if (stats) {
											callback(null, {
												...stats,
												dev: "OPFS",
												mime: "application/symlink",
												type: "symlink",
												isSymbolicLink: () => true,
												isDirectory: () => stats.type === "DIRECTORY",
												isFile: () => stats.type !== "DIRECTORY",
											});
										}
									});
								} else {
									callback(null, {
										name: file.name,
										size: file.size,
										mime: file.type === "DIRECTORY" ? "DIRECTORY" : "FILE",
										type: file.type,
										ctime: new Date(file.lastModified),
										mtime: new Date(file.lastModified),
										atime: new Date(),
										ctimeMs: file.lastModified,
										mtimeMs: file.lastModified,
										atimeMs: new Date().getTime(),
										dev: "OPFS",
										isSymbolicLink: () => false,
										isDirectory: () => file.type === "DIRECTORY",
										isFile: () => file.type !== "DIRECTORY",
										uid: 0,
										gid: 0,
									});
								}
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
										type: "DIRECTORY",
										mime: "DIRECTORY",
										ctime: 0,
										mtime: 0,
										atime: 0,
										atimeMs: 0,
										ctimeMs: 0,
										mtimeMs: 0,
										dev: "OPFS",
										isSymbolicLink: () => false,
										isDirectory: () => true,
										isFile: () => false,
										uid: 0,
										gid: 0,
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
										type: "DIRECTORY",
										mime: "DIRECTORY",
										ctime: 0,
										mtime: 0,
										atime: 0,
										ctimeMs: 0,
										mtimeMs: 0,
										atimeMs: 0,
										dev: "OPFS",
										isSymbolicLink: () => false,
										isDirectory: () => true,
										isFile: () => false,
										uid: 0,
										gid: 0,
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
	 * @returns An object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
	 * @example
	 * tfs.fs.lstat("/documents/file.txt", (err, stats) => {
	 *   if (err) throw err;
	 *   console.log(stats);
	 * });
	 */
	lstat(path: string, callback: (err: Error | null, stats?: FSStats | null) => void) {
		const normalizedPath = this.normalizePath(path);
		if (normalizedPath === "/") {
			callback(null, {
				name: "/",
				size: 0,
				type: "DIRECTORY",
				mime: "DIRECTORY",
				ctime: 0,
				mtime: 0,
				atime: 0,
				atimeMs: 0,
				ctimeMs: 0,
				mtimeMs: 0,
				dev: "OPFS",
				isSymbolicLink: () => false,
				isDirectory: () => true,
				isFile: () => false,
				uid: 0,
				gid: 0,
			});
			return;
		}
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
								mime: file.type === "DIRECTORY" ? "DIRECTORY" : "FILE",
								ctime: new Date(file.lastModified),
								mtime: new Date(file.lastModified),
								atime: new Date(),
								ctimeMs: file.lastModified,
								mtimeMs: file.lastModified,
								atimeMs: new Date().getTime(),
								dev: "OPFS",
								isSymbolicLink: () => false,
								isDirectory: () => file.type === "DIRECTORY",
								isFile: () => file.type !== "DIRECTORY",
								uid: 0,
								gid: 0,
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
										type: "DIRECTORY",
										mime: "DIRECTORY",
										ctime: 0,
										mtime: 0,
										atime: 0,
										ctimeMs: 0,
										mtimeMs: 0,
										atimeMs: 0,
										dev: "OPFS",
										isSymbolicLink: () => false,
										isDirectory: () => true,
										isFile: () => false,
										uid: 0,
										gid: 0,
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
										type: "DIRECTORY",
										mime: "DIRECTORY",
										ctime: 0,
										mtime: 0,
										atime: 0,
										atimeMs: 0,
										ctimeMs: 0,
										mtimeMs: 0,
										dev: "OPFS",
										isSymbolicLink: () => false,
										isDirectory: () => true,
										isFile: () => false,
										uid: 0,
										gid: 0,
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
	appendFile(path: string, data: string | ArrayBuffer | ArrayBufferView, callback: (err: Error | null) => void) {
		this.readFile(path, "arraybuffer", (err, existingData) => {
			if (err && err.name !== "NotFoundError") {
				callback(err);
				return;
			}
			let newData: ArrayBuffer;
			if (existingData) {
				const existingArray = new Uint8Array(existingData);
				let dataArray: Uint8Array;
				if (typeof data === "string") {
					dataArray = new TextEncoder().encode(data);
				} else if (data instanceof ArrayBuffer) {
					dataArray = new Uint8Array(data);
				} else if (ArrayBuffer.isView(data)) {
					dataArray = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
				} else {
					callback(genError("invalid data type"));
					return;
				}
				const combined = new Uint8Array(existingArray.length + dataArray.length);
				combined.set(existingArray, 0);
				combined.set(dataArray, existingArray.length);
				newData = combined.buffer;
			} else {
				if (typeof data === "string") {
					newData = new TextEncoder().encode(data).buffer;
				} else if (data instanceof ArrayBuffer) {
					newData = data;
				} else if (ArrayBuffer.isView(data)) {
					const sliced = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
					newData = sliced instanceof ArrayBuffer ? sliced : new ArrayBuffer(0);
				} else {
					callback(genError("invalid data type"));
					return;
				}
			}
			this.writeFile(path, newData, "arraybuffer", callback);
		});
	}

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
						snapshot.set(fullPath, { size: stat.size, lastModified: stat.mtimeMs, type: stat.type });
						if (options?.recursive && stat.type === "DIRECTORY") {
							await walk(fullPath);
						}
					}
				}
			};
			const stat = await this.promises.stat(normalizedPath).catch(() => null);
			if (stat) {
				snapshot.set(normalizedPath, { size: stat.size, lastModified: stat.mtimeMs, type: stat.type });
				if (options?.recursive && stat.type === "DIRECTORY") {
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
	 * Deletes a file or symlink.
	 * @param path - The absolute or relative path of the file or symlink to delete.
	 * @param callback - Callback function called with the result. Receives an error (or null) if the deletion failed.
	 * @example
	 * tfs.fs.unlink("/documents/file.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("File deleted successfully!");
	 * });
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
	 * @example
	 * tfs.fs.rmdir("/documents/oldFolder", (err) => {
	 *   if (err) throw err;
	 *   console.log("Directory deleted successfully!");
	 * });
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
	 * @example
	 * // Syntax is the same for renaming both files and directories
	 * tfs.fs.rename("/documents/oldName.txt", "/documents/newName.txt", (err) => {
	 *   if (err) throw err;
	 *   console.log("File renamed successfully!");
	 * });
	 */
	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		const oldP = this.normalizePath(oldPath);
		const newP = this.normalizePath(newPath);
		this.stat(oldP, (err, stats) => {
			if (err || !stats) {
				if (callback) callback(genError(err, oldP));
				return;
			}
			if (stats.type === "DIRECTORY") {
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
									.then(() => this.shell.promises.rm(oldP, { recursive: true }))
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
	 * @example
	 * tfs.fs.exists("/documents/file.txt", (exists) => {
	 *   console.log("File exists:", exists);
	 * });
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
	 * Creates a symbolic link.
	 * @param target - The target path the symlink points to.
	 * @param path - The absolute or relative path where the symlink should be created.
	 * @param type - (Optional) The type of the symlink: "file", "dir", or "junction". Defaults to "file".
	 * @param callback - Optional callback function called when the operation completes. Receives an error if one occurs, or null on success.
	 */
	symlink(target: string, path: string, type?: "file" | "dir" | "junction", callback?: (err: Error | null) => void) {
		const symlinkType = type || "file";
		this.writeFile(path, `symlink:${target}:${symlinkType}`, "utf8", (err: Error | null) => {
			if (err) {
				if (callback) callback(genError(err, path));
			} else {
				if (callback) callback(null);
			}
		});
	}

	// Access is coming in v1.1 with the introduction of permissions and other missing FD features. for now this will just return true
	access = this.exists;

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
	readlink(path: string, callback?: (err: Error | null, target: string | null) => void) {
		const normalizedPath = this.normalizePath(path);
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
				file.text().then(text => {
					const isSymlink = /^symlink:(.+?):(file|dir|junction)$/.exec(text);
					if (isSymlink) {
						const target = isSymlink[1];
						if (callback) callback(null, target as string);
					}
				});
			})
			.catch(err => {
				if (callback) callback(genError(err, path), null);
			});
	}

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
	copyFile(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		const oldP = this.normalizePath(oldPath);
		const newP = this.normalizePath(newPath);
		this.readFile(oldP, "arraybuffer", (err, data) => {
			if (err) genError(err, oldP);
			this.writeFile(newP, data, "arraybuffer", callback);
		});
	}

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
	cp(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {
		this.stat(oldPath, (err, stats) => {
			if (err || !stats) {
				if (callback) callback(genError(err, oldPath));
				return;
			}
			if (stats.type === "DIRECTORY") {
				this.mkdir(newPath, err => {
					if (err) {
						if (callback) callback(genError(err, newPath));
						return;
					}
					this.readdir(oldPath, (err, entries) => {
						if (err) {
							if (callback) callback(genError(err, oldPath));
							return;
						}
						let pending = entries.length;
						if (!pending) {
							if (callback) callback(null);
							return;
						}
						let errorOccurred = false;
						entries.forEach((entry: string) => {
							this.cp(this.normalizePath(oldPath + "/" + entry), this.normalizePath(newPath + "/" + entry), err => {
								if (errorOccurred) return;
								if (err) {
									errorOccurred = true;
									if (callback) callback(genError(err, oldPath + "/" + entry));
									return;
								}
								if (!--pending && callback) callback(null);
							});
						});
					});
				});
			} else {
				this.copyFile(oldPath, newPath, callback);
			}
		});
	}

	promises = {
		/**
		 * Writes data to a file.
		 * @param file - The path to the file.
		 * @param content - The content to write to the file.
		 * @returns A promise that resolves when the file has been written.
		 * @example
		 * await tfs.fs.promises.writeFile("/documents/file.txt", "Hello, World!");
		 */
		writeFile: (file: string, content: string | ArrayBuffer | Blob, type?: "utf8" | "arraybuffer" | "blob" | "base64") => {
			return new Promise<void>((resolve, reject) => {
				this.writeFile(file, content, type, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		/**
		 * Reads the contents of a file.
		 * @param file - The path to the file.
		 * @param type - The type of the file contents.
		 * @returns A promise that resolves with the contents of the file.
		 * @example
		 * const data = await tfs.fs.promises.readFile("/documents/file.txt", "utf8");
		 */
		readFile: (file: string, type?: "utf8" | "arraybuffer" | "blob" | "base64") => {
			return new Promise<any>((resolve, reject) => {
				if (!type) type = "utf8";
				this.readFile(file, type, (err: Error | null, data: any) => {
					if (err) {
						reject(err);
					} else {
						resolve(data);
					}
				});
			});
		},
		/**
		 * Creates a new directory.
		 * @param dir - The path to the directory to create.
		 * @returns A promise that resolves when the directory has been created.
		 * @example
		 * await tfs.fs.promises.mkdir("/documents/newFolder");
		 */
		mkdir: (dir: string) => {
			return new Promise<void>((resolve, reject) => {
				this.mkdir(dir, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		/**
		 * Reads the contents of a directory.
		 * @param dir - The path to the directory to read.
		 * @returns A promise that resolves with an array of file names in the directory.
		 * @example
		 * const contents = await tfs.fs.promises.readdir("/documents");
		 */
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
		/**
		 * Retrieves information about a file or directory.
		 * @param path - The absolute or relative path of the file or directory to retrieve information for.
		 * @returns A promise that resolves with an object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
		 * @example
		 * const stats = await tfs.fs.promises.stat("/documents/file.txt");
		 */
		stat: (path: string) => {
			return new Promise<FSStats | null>((resolve, reject) => {
				this.stat(path, (err, stats) => {
					if (err) {
						reject(err);
					} else {
						resolve(stats!);
					}
				});
			});
		},
		/**
		 * Retrieves information about a symlink or file/directory.
		 * @param path - The absolute or relative path of the symlink or file/directory to retrieve information for.
		 * @returns A promise that resolves with an object containing the name, size, mime type of the file or just as directory, lastModified timestamp and also the methods: isSymbolicLink, isDirectory, isFile which return booleans.
		 * @example
		 * const stats = await tfs.fs.promises.stat("/documents/file.txt");
		 */
		lstat: (path: string) => {
			return new Promise<FSStats | null>((resolve, reject) => {
				this.lstat(path, (err, stats) => {
					if (err) {
						reject(err);
					} else {
						resolve(stats!);
					}
				});
			});
		},
		/**
		 * Appends data to a file. If the file does not exist, it is created.
		 * @param path - The absolute or relative path to the file to append data to.
		 * @param data - The data to append to the file.
		 * @returns A promise that resolves when the data has been appended.
		 * @example
		 * await tfs.fs.promises.appendFile("/documents/file.txt", "Additional content");
		 */
		appendFile: (path: string, data: string | ArrayBuffer | ArrayBufferView) => {
			return new Promise<void>((resolve, reject) => {
				this.appendFile(path, data, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		/**
		 * Deletes a file or symlink.
		 * @param path - The absolute or relative path of the file or symlink to delete.
		 * @returns A promise that resolves when the file or symlink has been deleted.
		 * @example
		 * await tfs.fs.promises.unlink("/documents/file.txt");
		 */
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
		/**
		 * Checks if a file or directory exists.
		 * @param path - The absolute or relative path of the file or directory to check.
		 * @returns A promise that resolves with a boolean indicating whether the file or directory exists.
		 * @example
		 * const exists = await tfs.fs.promises.exists("/documents/file.txt");
		 */
		exists: (path: string) => {
			return new Promise<boolean>(resolve => {
				this.exists(path, exists => {
					resolve(exists);
				});
			});
		},
		access: (path: string) => {
			return new Promise<boolean>(resolve => {
				this.exists(path, exists => {
					resolve(exists);
				});
			});
		},
		/**
		 * Deletes an empty directory.
		 * @param path - The absolute or relative path of the directory to delete.
		 * @returns A promise that resolves when the directory has been deleted.
		 * @example
		 * await tfs.fs.promises.rmdir("/documents/oldFolder");
		 */
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
		/**
		 * Renames a file or directory.
		 * @param oldPath - The absolute or relative path of the file or directory to rename.
		 * @param newPath - The new absolute or relative path of the file or directory.
		 * @returns A promise that resolves when the file or directory has been renamed.
		 * @example
		 * await tfs.fs.promises.rename("/documents/oldFile.txt", "/documents/newFile.txt");
		 */
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
		/**
		 * Copies a file.
		 * @param oldPath - The absolute or relative path of the file to copy.
		 * @param newPath - The new absolute or relative path of the copied file.
		 * @returns A promise that resolves when the file has been copied.
		 * @example
		 * await tfs.fs.promises.copyFile("/documents/oldFile.txt", "/documents/newFile.txt");
		 */
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
		/**
		 * Creates a symbolic link.
		 * @param target - The target path the symlink points to.
		 * @param path - The absolute or relative path where the symlink should be created.
		 * @param type - (Optional) The type of the symlink: "file", "dir", or "junction". Defaults to "file".
		 * @returns A promise that resolves when the symlink has been created.
		 * @example
		 * await tfs.fs.promises.symlink("/documents/target.txt", "/documents/symlink.txt", "file");
		 */
		symlink: (target: string, path: string, type?: "file" | "dir" | "junction") => {
			return new Promise<void>((resolve, reject) => {
				this.symlink(target, path, type, err => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
		/**
		 * Reads the target of a symbolic link.
		 * @param path - The absolute or relative path of the symlink to read.
		 * @returns A promise that resolves with the target path of the symlink.
		 * @example
		 * const target = await tfs.fs.promises.readlink("/documents/symlink.lnk");
		 */
		readlink: (path: string) => {
			return new Promise<string>((resolve, reject) => {
				this.readlink(path, (err, target) => {
					if (err) {
						reject(err);
					} else {
						resolve(target!);
					}
				});
			});
		},
		/**
		 * Copies a file or directory.
		 * @param oldPath - The absolute or relative path of the file or directory to copy.
		 * @param newPath - The absolute or relative path where the file or directory should be copied to.
		 * @returns A promise that resolves when the file or directory has been copied.
		 * @example
		 * await tfs.fs.promises.cp("/documents/sourceFolder", "/documents/destinationFolder");
		 */
		cp: (oldPath: string, newPath: string) => {
			return new Promise<void>((resolve, reject) => {
				this.cp(oldPath, newPath, err => {
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
