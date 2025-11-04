# TODO List

- [ ] Add fd fs based operations,
- [x] Add self format option
- [x] Add mmkdirp and tempDir
- [x] Add permissions set and additional file metadata

## Supported FS Operations

Updated for v1.0.15-beta
Current chart of Filer methods supported by TFS

| Method | Implemented | Callback API | Promises API |
|---|---:|---:|---:|
| fs.rename | Yes | Yes | Yes |
| fs.ftruncate | No | No | No |
| fs.truncate | No | No | No |
| fs.stat | Yes | Yes | Yes |
| fs.fstat | No | No | No |
| fs.lstat | Yes | Yes | Yes |
| fs.exists | Yes | Yes | Yes (Non Standard) |
| fs.link | Yes | Yes | Yes |
| fs.symlink | Yes | Yes | Yes |
| fs.readlink | Yes | Yes | Yes |
| fs.unlink | Yes | Yes | Yes |
| fs.mknod | No | No | No |
| fs.rmdir | Yes | Yes | Yes |
| fs.mkdir | Yes | Yes | Yes |
| fs.access | Yes | Yes | Yes |
| fs.mkdtemp | Yes | Yes | Yes |
| fs.readdir | Yes | Yes | Yes |
| fs.close | No | No | No |
| fs.open | No | No | No |
| fs.utimes | No | No | No |
| fs.futimes | No | No | No |
| fs.chown | Yes | Yes | Yes |
| fs.fchown | No | No | No |
| fs.chmod | Yes | Yes | Yes |
| fs.fchmod | No | No | No |
| fs.fsync | No | No | No |
| fs.write | No | No | No |
| fs.read | No | No | No |
| fs.readFile | Yes | Yes | Yes |
| fs.writeFile | Yes | Yes | Yes |
| fs.appendFile | Yes | Yes | Yes |
| fs.setxattr | No | No | No |
| fs.fsetxattr | No | No | No |
| fs.getxattr | No | No | No |
| fs.fgetxattr | No | No | No |
| fs.removexattr | No | No | No |
| fs.fremovexattr | No | No | No |

## Progress

Progress based on the "Implemented" column:

`[███████████░░░░░░░░] 51.3%`

Implemented: 19 of 37 — 51.3% complete.
