import { createFSError } from "../fs/errors";
import { Path } from "../path/index";
import { FS } from "../fs/index";

export class Shell {
	handle: FileSystemDirectoryHandle;
	cwd: string;
	private fs: FS;
	private path: Path;

	constructor(handle: FileSystemDirectoryHandle) {
		this.handle = handle;
		this.cwd = "/";
		this.fs = new FS(this.handle);
		this.path = new Path();
	}

	async cd(path: string): Promise<void> {
		const newPath = this.path.join(this.cwd, path);
		if (await this.fs.promises.exists(newPath)) {
			this.cwd = newPath;
		} else {
			throw createFSError("ENOENT", `No such file or directory: ${newPath}`);
		}
	}
}
