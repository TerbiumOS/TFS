import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
	plugins: [
		viteStaticCopy({
			targets: [
				{
					src: "../dist/web/*",
					dest: "dist",
				},
				{
					src: "./node_modules/filer/dist/*",
					dest: "filer",
				},
			],
		}),
	],
});
