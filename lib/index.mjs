"use strict";

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { TFS } from "../dist/node/tfs.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const tfsPath = resolve(__dirname, "..", "dist", "web");

export { TFS, tfsPath };