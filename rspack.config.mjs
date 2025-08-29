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
						loader: "ts-loader",
					},
				],
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
});
