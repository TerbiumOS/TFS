import { defineConfig } from "@rspack/cli";

export default defineConfig({
	entry: {
		tfs: "./src/index.ts",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				include: /src/,
				use: [
					{
						loader: "ts-loader",
					},
				],
			},
		],
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
});
