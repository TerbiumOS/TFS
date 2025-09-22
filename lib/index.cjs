"use strict";

const { resolve } = require("node:path");
const TFSModule = require("../dist/tfs.js");

const tfsPath = resolve(__dirname, "..", "dist");

exports.tfsPath = tfsPath;
exports.TFS = TFSModule.TFS;
