import { FS } from "../fs/index";
export declare class Shell {
    handle: FileSystemDirectoryHandle;
    cwd: string;
    private fs;
    private path;
    constructor(handle: FileSystemDirectoryHandle, fs?: FS);
    cd(path: string): void;
    promises: {
        cd: (path: string) => Promise<void>;
    };
}
//# sourceMappingURL=index.d.ts.map