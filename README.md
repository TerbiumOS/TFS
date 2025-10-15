# TFS

The drop in Filer replacement you’ve been waiting for. Completely Typed and Built with TypeScript

## Usage

Initializing TFS is slightly different than Filer. TFS.init must be called whenever loading the TFS module.

The TFS Object consists of: FS, Path, Shell, and Buffer.
The Buffer utility is actually the same as Filer and is powered by the [Ferros Buffer Library](https://github.com/feross/buffer) with the same exact syntax as node:buffer and Filer.Buffer

To load TFS conviently, simply run:

```js
const tfs = await tfs.init()
```

If you need a specific module from TFS, you can desctructure the object for the one that you need

```js
const { fs } = await tfs.init()
```

Or if you do not wish to use one of the following methods to initialize TFS, you can also use the constructor as normal;

```js
const handle = await navigator.storage.getDirectory();
const tfs = new tfs(handle);
```

The TFS Shell works slightly different than the Filer Shell, it is already instantiated so you do not need to create a new instance of the Shell and you can directly call it as:

```js
const shell = tfs.shell
```

```js
const shell = tfs.fs.shell
```

however, if your lazy or are using some kind of compatability layer and still want the 1 to 1 support, TFS provides `tfs.sh` as a uninitialized shell however this isnt recommended.

As for the actual FS Usage, it remains the same as [Filer](https://github.com/filerjs/filer?tab=readme-ov-file#api-reference) which targets a [node:fs](https://nodejs.org/api/fs.html) like syntax

## Contributing

Contributions are always welcome! Feel free to make a PR to help advance this project even further as its not just intended for Terbium use but also for use in projects that already rely on Filer for storage

If you find a security vulnerability, please contact security@terbiumon.top and **DO NOT** report it in the github issues space.

Also, Please make sure that the CI passes before you create your PR as it makes life easier for everyone/

## Credits

Libraries Used

- [Ferros Buffer Library](https://github.com/feross/buffer) - MIT License
- [Minimatch](https://github.com/isaacs/minimatch) - ISC License

Made with ❤️ By the Terbium Development Team

&copy; Copyright 2025 TerbiumOS Development

Licensed Under the [Apache 2.0 License](./LICENSE)
