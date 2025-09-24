import { TFS } from "../src";

declare const tfsPath: string;
declare global {
	interface Window {
		tfs: typeof TFS;
	}
}
declare type TFSType = InstanceType<typeof TFS>;

export { tfsPath, TFS, TFSType };
