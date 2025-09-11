/**
 * The TFS Path Operations Class
 */
export class Path {
	sep: string = "/";
	delimiter: string = ":";

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

	basename(path: string, ext?: string): string {
		const base = path.split("/").pop() || "";
		if (ext && base.endsWith(ext)) {
			return base.slice(0, -ext.length) || "/";
		}
		return base === "" ? "/" : base;
	}

	normalize(path: string): string {
		const normalized = this.normalizePath(path);
		return normalized === "/" ? "/" : this.removeTrailing(normalized);
	}

	isNull(path: string): boolean {
		return ("" + path).indexOf("\u0000") !== -1;
	}

	addTrailing(path: string): string {
		return path.replace(/\/*$/, "/");
	}

	removeTrailing(path: string): string {
		path = path.replace(/\/*$/, "");
		return path === "" ? "/" : path;
	}

	join(...paths: string[]): string {
		return paths
			.filter(Boolean)
			.map((p, i) => (i === 0 ? p.replace(/\/+$/, "") : p.replace(/^\/+|\/+$/g, "")))
			.join(this.sep);
	}

	dirname(path: string): string {
		if (!path || path === "/") return "/";
		const parts = path.split("/").filter(Boolean);
		parts.pop();
		return "/" + parts.join("/");
	}

	extname(path: string): string {
		const base = path.split("/").pop() || "";
		const idx = base.lastIndexOf(".");
		return idx > 0 ? base.slice(idx) : "";
	}

	isAbsolute(path: string): boolean {
		return path.startsWith("/");
	}

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
