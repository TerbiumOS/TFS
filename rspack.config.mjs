import { defineConfig } from "@rspack/cli";
import path from "path";

export default defineConfig([
	{
		entry: {
			tfs: "./src/index.ts",
		},
		output: {
			path: path.resolve(process.cwd(), "dist/web"),
			filename: "tfs.js",
		},
		target: "web",
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: [
						{
							loader: "builtin:swc-loader",
						},
					],
					exclude: [/node_modules/, /demo/],
				},
			],
		},
		resolve: {
			extensions: [".ts", ".js"],
		},
	},
	{
		entry: {
			tfs: "./src/index.ts",
		},
		experiments: {
			outputModule: true,
		},
		output: {
			path: path.resolve(process.cwd(), "dist/node"),
			filename: "tfs.js",
			library: {
				type: "module",
			},
			module: true,
		},
		target: ["node", "web"],
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: [
						{
							loader: "builtin:swc-loader",
						},
					],
					exclude: [/node_modules/, /demo/],
				},
			],
		},
		resolve: {
			extensions: [".ts", ".js"],
		},
	},
]);
