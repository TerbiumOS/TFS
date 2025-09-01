import { Buffer } from "buffer";
import { FS } from "./fs";
import { Path } from "./path";
import { Shell } from "./shell";
declare global {
	interface Window {
		tfs: typeof TFS;
	}
}
export declare class TFS {
	handle: FileSystemDirectoryHandle;
	fs: FS;
	path: Path;
	buffer: typeof Buffer;
	shell: Shell;
	version: string;
	private constructor();
	static init(): Promise<TFS>;
}
//# sourceMappingURL=index.d.ts.map
