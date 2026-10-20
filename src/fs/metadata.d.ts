export declare const TSD_FILE = ".TSD";
export declare const LEGACY_TFS_STORE_FILE = ".TFS_STORE";
export type MetadataEntry = {
	perms: string[];
	uid: number;
	gid: number;
};
export type MetadataMap = Record<string, MetadataEntry>;
export interface MetadataState {
	perms: MetadataMap;
	migratedFromLegacy: boolean;
}
type MetadataUpdate = MetadataEntry | boolean;
export type MetadataUpdates = Record<string, MetadataUpdate>;
export declare const initializeMetadata: (handle: FileSystemDirectoryHandle) => Promise<MetadataState>;
export declare const updateMetadata: (handle: FileSystemDirectoryHandle, updates?: MetadataUpdates) => Promise<void>;
export declare const resetMetadata: (handle: FileSystemDirectoryHandle) => Promise<MetadataState>;
export declare const flushMetadata: (handle: FileSystemDirectoryHandle) => Promise<void>;
export {};
//# sourceMappingURL=metadata.d.ts.map
