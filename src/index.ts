import { Buffer } from "./buffer";
import { FS } from "./fs";
import { Path } from "./path";
import { Shell } from "./shell";

export class TFS {
	handle: FileSystemHandle;
	fs: FS;
	path: Path;
	buffer: Buffer;
	shell: Shell;

	private constructor(handle: FileSystemHandle) {
		this.handle = handle;
		this.fs = new FS(this.handle);
		this.path = new Path(this.handle);
		this.buffer = new Buffer(this.handle);
		this.shell = new Shell(this.handle);
	}

	static async create(): Promise<TFS> {
		const handle = await navigator.storage.getDirectory();
		return new TFS(handle);
	}
}
