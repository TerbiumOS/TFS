import { TFS } from "../src/index";
import { FS } from "../src/fs/index";
import { Shell } from "../src/shell/index";
import { Path } from "../src/path/index";

declare const tfsPath: string;
declare global {
	interface Window {
		tfs: TFSType;
	}
}
declare type TFSType = InstanceType<typeof TFS>;
declare type FSType = InstanceType<typeof FS>;
declare type ShellType = InstanceType<typeof Shell>;
declare type PathType = InstanceType<typeof Path>;

export { tfsPath, TFS, TFSType, FSType, ShellType, PathType };
