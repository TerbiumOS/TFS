export declare class Path {
    sep: string;
    delimiter: string;
    normalizePath(path: string, sep?: string): string;
    basename(path: string, ext?: string): string;
    normalize(path: string): string;
    isNull(path: string): boolean;
    addTrailing(path: string): string;
    removeTrailing(path: string): string;
    join(...paths: string[]): string;
    dirname(path: string): string;
    extname(path: string): string;
    isAbsolute(path: string): boolean;
    relative(from: string, to: string): string;
    resolve(...paths: string[]): string;
}
//# sourceMappingURL=index.d.ts.map