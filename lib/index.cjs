"use strict";

const { resolve } = require("node:path");

const tfsPath = resolve(__dirname, "..", "dist");

exports.tfsPath = tfsPath;
