import { createFSError } from "../fs/errors";
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

	promises = {
		cd: (path: string): Promise<void> => {
			return new Promise(resolve => {
				this.cd(path);
				resolve();
			});
		},
	};
}
