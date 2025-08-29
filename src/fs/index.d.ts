export declare class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;
	constructor(handle: FileSystemDirectoryHandle);
	normalizePath(path: string, currPath?: string): string;
	writeFile(file: string, content: string | ArrayBuffer | Blob): void;
	readFile(file: string, type: "utf8" | "arraybuffer" | "blob", callback: (err: Error | null, data: any) => void): void;
	mkdir(dir: string): void;
	readdir(dir: string, callback: (err: Error | null, data: any) => void): void;
	stat(
		path: string,
		callback: (
			err: Error | null,
			stats?: {
				name: string;
				size: number;
				type: string;
				lastModified: number;
			} | null,
		) => void,
	): void;
	promises: {
		writeFile: (file: string, content: string | ArrayBuffer | Blob) => Promise<void>;
		readFile: (file: string, type: "utf8" | "arraybuffer" | "blob") => Promise<any>;
		mkdir: (dir: string) => Promise<void>;
		readdir: (dir: string) => Promise<string[]>;
		stat: (path: string) => Promise<{
			name: string;
			size: number;
			type: string;
			lastModified: number;
		} | null>;
	};
}
//# sourceMappingURL=index.d.ts.map
