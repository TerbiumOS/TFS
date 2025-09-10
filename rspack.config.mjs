import { defineConfig } from "@rspack/cli";

export default defineConfig({
	entry: {
		tfs: "./src/index.ts",
	},
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
});
