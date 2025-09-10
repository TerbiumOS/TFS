export declare class Shell {
	handle: FileSystemDirectoryHandle;
	cwd: string;
	private fs;
	private path;
	constructor(handle: FileSystemDirectoryHandle);
	cd(path: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map
