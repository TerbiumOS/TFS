import { exec } from "node:child_process";
import { watch } from "node:fs";

async function run() {
	const viteProcess = exec("vite dev");
	viteProcess.stdout?.on("data", data => console.log(`[vite] ${data}`));
	viteProcess.stderr?.on("data", data => console.error(`[vite error] ${data}`));

	let isBuilding = false;
	watch("../src", { recursive: true }, () => {
		if (isBuilding) return;
		isBuilding = true;

		const buildProc = exec("npm run build", { cwd: "../" });
		buildProc.stdout?.on("data", data => console.log(`[build] ${data}`));
		buildProc.stderr?.on("data", data => console.error(`[build error] ${data}`));

		buildProc.on("close", () => {
			const fmtProc = exec("npm run fmt", { cwd: "../" });
			fmtProc.stdout?.on("data", data => console.log(`[biome] ${data}`));
			fmtProc.stderr?.on("data", data => console.error(`[biome error] ${data}`));
			fmtProc.on("close", () => {
				isBuilding = false;
			});
		});
	});
}

run();
