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

	writeFile(file: string, content: string | ArrayBuffer | Blob) {
		const normalizedPath = this.normalizePath(file);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);

		const fileName = parts[parts.length - 1];
		dirPromise
			.then(dirHandle => dirHandle.getFileHandle(fileName as string, { create: true }))
			.then(fileHandle => fileHandle.createWritable())
			.then(writable => writable.write(content).then(() => writable.close()));
	}

	readFile(file: string, type: "utf8" | "arraybuffer" | "blob", callback: (err: Error | null, data: any) => void) {
		const normalizedPath = this.normalizePath(file);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise: Promise<FileSystemDirectoryHandle> = Promise.resolve(this.handle);
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
				}
				file.text().then(data => callback(null, data));
			})
			.catch(err => callback(err, null));
	}

	mkdir(dir: string) {
		const normalizedPath = this.normalizePath(dir);
		const parts = normalizedPath.split("/").filter(Boolean);
		let dirPromise = Promise.resolve(this.handle);

		for (const part of parts) {
			dirPromise = dirPromise.then(dirHandle => dirHandle.getDirectoryHandle(part, { create: true }));
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
						.catch(err => callback(err, null));
				}
				next();
			})
			.catch(err => {
				callback(err, null);
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
					.catch(() =>
						dirHandle.getDirectoryHandle(lastPart as string).then(() =>
							callback(null, {
								name: lastPart as string,
								size: 0,
								type: "directory",
								lastModified: 0,
							}),
						),
					),
			)
			.catch(err => callback(err, null));
	}

	lstat(path: string, callback: (err: Error | null, stats?: { name: string; size: number; type: string; lastModified: number } | null) => void) {
		this.stat(path, callback);
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
	};
}
