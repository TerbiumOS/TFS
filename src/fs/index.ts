import { createFSError } from "./errors";

export class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;

	constructor(handle: FileSystemDirectoryHandle) {
		this.handle = handle;
		this.currPath = "/";
	}

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
				if (callback) {
					if (err && err.name === "NotFoundError") {
						callback(createFSError("ENOENT", file));
					} else {
						console.log(err);
						callback(createFSError("UNKNOWN", file));
					}
				}
			});
	}

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
				if (err && err.name === "NotFoundError") {
					callback(createFSError("ENOENT", file), null);
				} else if (err && err.name === "TypeMismatchError") {
					callback(createFSError("EISDIR", file), null);
				} else {
					callback(createFSError("UNKNOWN", file), null);
				}
			});
	}

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
					if (err && err.name === "NotFoundError") {
						callback(createFSError("ENOENT", dir));
					} else if (err && err.name === "TypeMismatchError") {
						callback(createFSError("EISDIR", dir));
					} else {
						callback(createFSError("UNKNOWN", dir));
					}
				});
		}
	}

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
							if (err && err.name === "NotFoundError") {
								callback(createFSError("ENOENT", dir), null);
							} else if (err && err.name === "TypeMismatchError") {
								callback(createFSError("EISDIR", dir), null);
							} else {
								callback(createFSError("UNKNOWN", dir), null);
							}
						});
				}
				next();
			})
			.catch(err => {
				if (err && err.name === "NotFoundError") {
					callback(createFSError("ENOENT", dir), null);
				} else if (err && err.name === "TypeMismatchError") {
					callback(createFSError("EISDIR", dir), null);
				} else {
					callback(createFSError("UNKNOWN", dir), null);
				}
			});
	}

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
									if (err && err.name === "NotFoundError") {
										callback(createFSError("ENOENT", path), null);
									} else if (err && err.name === "TypeMismatchError") {
										callback(createFSError("ENOTDIR", path), null);
									} else {
										callback(createFSError("UNKNOWN", path), null);
									}
								});
						} else if (err && err.name === "TypeMismatchError") {
							callback(createFSError("EISDIR", path), null);
						} else {
							callback(createFSError("UNKNOWN", path), null);
						}
					}),
			)
			.catch(err => {
				if (err && err.name === "NotFoundError") {
					callback(createFSError("ENOENT", path), null);
				} else if (err && err.name === "TypeMismatchError") {
					callback(createFSError("ENOTDIR", path), null);
				} else {
					callback(createFSError("UNKNOWN", path), null);
				}
			});
	}

	lstat(path: string, callback: (err: Error | null, stats?: { name: string; size: number; type: string; lastModified: number } | null) => void) {
		this.stat(path, callback);
	}

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
				if (err && err.name === "NotFoundError") {
					callback?.(createFSError("ENOENT", path));
				} else if (err && err.name === "TypeMismatchError") {
					callback?.(createFSError("EISDIR", path));
				} else {
					callback?.(createFSError("UNKNOWN", path));
				}
			});
	}

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

	rmdir(path: string, callback?: (err: Error | null) => void) {}

	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {}

	copyFile(oldPath: string, newPath: string, callback?: (err: Error | null) => void) {}

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
