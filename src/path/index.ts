/**
 * The TFS Path Operations Class
 */
export class Path {
	sep: string = "/";
	delimiter: string = ":";

	/**
	 * Normalizes a given path, resolving "." and ".." segments and removing unneeded separators.
	 * @param path - The path string to normalize.
	 * @param sep - Optional separator to use instead of the default.
	 * @returns The normalized path.
	 * @example
	 * tfs.path.normalizePath('/foo/../bar/./baz'); // '/bar/baz'
	 */
	normalizePath(path: string, sep?: string): string {
		if (sep) this.sep = sep;
		if (!path) return this.sep;
		if (!path.startsWith("/")) path = this.sep + "/" + path;

		const parts = path.split("/").filter(Boolean);
		const stack: string[] = [];

		for (const part of parts) {
			if (part === "." || part === "") continue;
			if (part === "..") {
				if (stack.length > 0) stack.pop();
			} else {
				stack.push(part);
			}
		}

		let newPath = "/" + stack.join("/");
		if (newPath === "//") newPath = "/";

		return newPath;
	}

	/**
	 * Returns the last portion of a path, optionally removing a given extension.
	 * @param path - The path string.
	 * @param ext - Optional extension to remove from the result.
	 * @returns The basename of the path.
	 * @example
	 * tfs.fs.basename('/foo/bar/baz.txt', '.txt'); // 'baz'
	 */
	basename(path: string, ext?: string): string {
		const base = path.split("/").pop() || "";
		if (ext && base.endsWith(ext)) {
			return base.slice(0, -ext.length) || "/";
		}
		return base === "" ? "/" : base;
	}

	/**
	 * Normalizes a path and removes any trailing separators, except for the root.
	 * @param path - The path string to normalize.
	 * @returns The normalized path without trailing separators.
	 * @example
	 * tfs.path.normalize('/foo/bar/'); // '/foo/bar'
	 */
	normalize(path: string): string {
		const normalized = this.normalizePath(path);
		return normalized === "/" ? "/" : this.removeTrailing(normalized);
	}

	/**
	 * Checks if a path contains a null character.
	 * @param path - The path string to check.
	 * @returns True if the path contains a null character, otherwise false.
	 * @example
	 * tfs.path.isNull('foo\u0000bar'); // true
	 */
	isNull(path: string): boolean {
		return ("" + path).indexOf("\u0000") !== -1;
	}

	/**
	 * Ensures that a path ends with a trailing separator.
	 * @param path - The path string.
	 * @returns The path with a trailing separator.
	 * @example
	 * tfs.path.addTrailing('/foo/bar'); // '/foo/bar/'
	 */
	addTrailing(path: string): string {
		return path.replace(/\/*$/, "/");
	}

	/**
	 * Removes any trailing separators from a path, except for the root.
	 * @param path - The path string.
	 * @returns The path without trailing separators.
	 * @example
	 * tfs.path.removeTrailing('/foo/bar/'); // '/foo/bar'
	 */
	removeTrailing(path: string): string {
		path = path.replace(/\/*$/, "");
		return path === "" ? "/" : path;
	}

	/**
	 * Joins multiple path segments into a single path.
	 * @param paths - The path segments to join.
	 * @returns The joined path.
	 * @example
	 * tfs.path.join('/foo', 'bar', 'baz'); // '/foo/bar/baz'
	 */
	join(...paths: string[]): string {
		return paths
			.filter(Boolean)
			.map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
			.join(this.sep);
	}

	/**
	 * Returns the directory name of a path.
	 * @param path - The path string.
	 * @returns The directory portion of the path.
	 * @example
	 * tfs.path.dirname('/foo/bar/baz.txt'); // '/foo/bar'
	 */
	dirname(path: string): string {
		if (!path || path === "/") return "/";
		const parts = path.split("/").filter(Boolean);
		parts.pop();
		return "/" + parts.join("/");
	}

	/**
	 * Returns the extension of the path, from the last '.' to end of string.
	 * @param path - The path string.
	 * @returns The extension of the path, including the leading '.'.
	 * @example
	 * tfs.path.extname('/foo/bar/baz.txt'); // '.txt'
	 */
	extname(path: string): string {
		const base = path.split("/").pop() || "";
		const idx = base.lastIndexOf(".");
		return idx > 0 ? base.slice(idx) : "";
	}

	/**
	 * Determines if a path is absolute.
	 * @param path - The path string.
	 * @returns True if the path is absolute, otherwise false.
	 * @example
	 * tfs.fs.isAbsolute('/foo/bar'); // true
	 * tfs.fs.isAbsolute('foo/bar'); // false
	 */
	isAbsolute(path: string): boolean {
		return path.startsWith("/");
	}

	/**
	 * Calculates the relative path from one path to another.
	 * @param from - The starting path.
	 * @param to - The target path.
	 * @returns The relative path from `from` to `to`.
	 * @example
	 * tfs.path.relative('/foo/bar', '/foo/baz/qux'); // '../baz/qux'
	 */
	relative(from: string, to: string): string {
		const fromParts = this.normalizePath(from).split("/").filter(Boolean);
		const toParts = this.normalizePath(to).split("/").filter(Boolean);

		let i = 0;
		while (i < fromParts.length && i < toParts.length && fromParts[i] === toParts[i]) {
			i++;
		}

		const up = fromParts.slice(i).map(() => "..");
		const down = toParts.slice(i);
		return [...up, ...down].join("/") || ".";
	}

	/**
	 * Resolves a sequence of paths or path segments into an absolute path.
	 * @param paths - The sequence of paths to resolve.
	 * @returns The resolved absolute path.
	 * @example
	 * tfs.path.resolve('/foo', 'bar', '../baz'); // '/foo/baz'
	 */
	resolve(...paths: string[]): string {
		let resolved = "";
		for (const p of paths) {
			if (this.isAbsolute(p)) {
				resolved = p;
			} else {
				resolved = this.join(resolved, p);
			}
		}
		return this.normalize(resolved);
	}
}
