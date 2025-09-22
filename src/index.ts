import { Buffer } from "buffer";
import { FS } from "./fs";
import { Path } from "./path";
import { Shell } from "./shell";
import { version } from "../package.json";

declare global {
	interface Window {
		tfs: typeof TFS;
	}
}

/**
 * The TFS File System Library
 */
export class TFS {
	handle: FileSystemDirectoryHandle;
	fs: FS;
	path: Path;
	buffer: typeof Buffer = Buffer;
	shell: Shell;
	version: string = version;

	private constructor(handle: FileSystemDirectoryHandle) {
		this.handle = handle;
		this.fs = new FS(this.handle);
		this.path = new Path();
		this.shell = new Shell(this.handle);
	}

	/**
	 * Creates a new instance of TFS
	 * @returns {Promise<TFS>} Instance of TFS
	 */
	static async init(): Promise<TFS> {
		const handle = await navigator.storage.getDirectory();
		return new TFS(handle);
	}
}

if (typeof window !== "undefined") {
	window.tfs = TFS;
}
