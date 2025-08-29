import { defineConfig } from '@rspack/cli';
import type { RspackConfigExport } from '@rspack/cli/dist/cli';

export default defineConfig({
  entry: {
    main: "./src/index.ts"
  },
}) as RspackConfigExport