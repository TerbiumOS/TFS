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

		const buildProcess = exec("npm run build", { cwd: "../" });
		buildProcess.stdout?.on("data", data => console.log(`[build] ${data}`));
		buildProcess.stderr?.on("data", data => console.error(`[build error] ${data}`));

		buildProcess.on("close", () => {
			isBuilding = false;
		});
	});
}

run();
