import { createFSError, genError } from "../fs/errors";
import { Path } from "../path/index";
import { FS } from "../fs/index";

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

	pwd() {
		return this.cwd;
	}

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

	promises = {
		cd: (path: string): Promise<void> => {
			return new Promise(resolve => {
				this.cd(path);
				resolve();
			});
		},
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
	};
}
