import { Buffer } from "./buffer";
import { FS } from "./fs";
import { Path } from "./path";
import { Shell } from "./shell";
export declare class TFS {
	handle: FileSystemHandle;
	fs: FS;
	path: Path;
	buffer: Buffer;
	shell: Shell;
	private constructor();
	static create(): Promise<TFS>;
}
//# sourceMappingURL=index.d.ts.map
