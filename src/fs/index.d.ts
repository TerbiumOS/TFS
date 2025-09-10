import { Shell } from "../shell";
export declare class FS {
	handle: FileSystemDirectoryHandle;
	currPath: string;
	shell: Shell;
	constructor(handle: FileSystemDirectoryHandle);
	normalizePath(path: string, currPath?: string): string;
	writeFile(file: string, content: string | ArrayBuffer | Blob, callback?: (err: Error | null) => void): void;
	readFile(file: string, type: "utf8" | "arraybuffer" | "blob" | "base64", callback: (err: Error | null, data: any) => void): void;
	mkdir(dir: string, callback?: (err: Error | null) => void): void;
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
	lstat(
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
	watch(
		path: string,
		options?: {
			recursive?: boolean;
		},
		listener?: (event: "rename" | "change", filename: string) => void,
	): {
		on: (event: "rename" | "change", cb: (event: "rename" | "change", filename: string) => void) => void;
		close: () => void;
	};
	unlink(path: string, callback?: (err: Error | null) => void): void;
	rmdir(path: string, callback?: (err: Error | null) => void): void;
	rename(oldPath: string, newPath: string, callback?: (err: Error | null) => void): void;
	exists(path: string, callback?: (exists: boolean) => void): void;
	copyFile(oldPath: string, newPath: string, callback?: (err: Error | null) => void): void;
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
		lstat: (path: string) => Promise<{
			name: string;
			size: number;
			type: string;
			lastModified: number;
		} | null>;
		unlink: (path: string) => Promise<void>;
		exists: (path: string) => Promise<boolean>;
		rmdir: (path: string) => Promise<void>;
		rename: (oldPath: string, newPath: string) => Promise<void>;
		copyFile: (oldPath: string, newPath: string) => Promise<void>;
	};
}
//# sourceMappingURL=index.d.ts.map
