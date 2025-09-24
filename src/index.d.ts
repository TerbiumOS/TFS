import { Buffer } from "buffer";
import { FS } from "./fs";
import { Path } from "./path";
import { Shell } from "./shell";
declare global {
	interface Window {
		tfs: typeof TFS;
	}
}
/**
 * The TFS File System Library
 */
export declare class TFS {
	handle: FileSystemDirectoryHandle;
	fs: FS;
	path: Path;
	buffer: typeof Buffer;
	shell: Shell;
	version: string;
	private constructor();
	/**
	 * Creates a new instance of TFS
	 * @returns {Promise<TFS>} Instance of TFS
	 */
	static init(): Promise<TFS>;
	/**
	 * Initializes TFS for use in a service worker
	 * @returns {void}
	 * @example
	 * // In your service worker file
	 * importScripts("/tfs/tfs.js");
	 * tfs.initSw();
	 * // TFS is now defined on self
	 */
	static initSw(): void;
}
//# sourceMappingURL=index.d.ts.map
