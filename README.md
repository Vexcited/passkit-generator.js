# `passkit-generator.js`

Simple JS/TS interface to generate customized [Apple Wallet Passes](https://developer.apple.com/wallet/) for iOS and WatchOS.

This is a rewrite of <https://github.com/alexandercerutti/passkit-generator> without Node.js' `Buffer`. Every `Buffer` is replaced with `Uint8Array`. `fs` and `stream` are removed so you can only get as raw and get as buffer. That means you have to provide buffers manually, see the following example that was run in a web browser :

```typescript
import { PKPass } from "passkit-generator.js";
import forge from "node-forge";

// A random pass ID is generated here, you can use your own logic to generate it.
const passID = forge.md5.create()
  .update(Date.now().toString())
  .digest()
  .toHex();

/// In this example, we're using fetch to get the pass files from the server
/// under the /export path. You can replace the read function with your own
/// implementation to read the pass files from the file system or any other source.
const read = async (name: string): Promise<Uint8Array> => {
  const response = await fetch("/export" + name)
  const buffer = await response.arrayBuffer()
  return new Uint8Array(buffer)
};

const pass = new PKPass({
  "pass.json": await read("/ticket.pass/pass.json"),
  "icon@3x.png": await read("/ticket.pass/icon@3x.png"),
  "logo.png": await read("/ticket.pass/logo.png"),
  "strip.png": await read("/ticket.pass/strip.png"),
}, {
  signerCert: await read("/certs/signerCert.pem"),
  signerKey: await read("/certs/signerKey.pem"),
  wwdr: await read("/certs/wwdr.pem"),
  signerKeyPassphrase: "1234"
}, { serialNumber: passID });

const buffer = pass.getAsBuffer();
// `buffer` is now an Uint8Array corresponding
// to the generated pass in `.pkpass` format.

// You can download it as a "application/vnd.apple.pkpass" file
```

## Installation

You can install this package using npm, yarn, pnpm or whatever package manager you use :

```bash
npm add passkit-generator.js
yarn add passkit-generator.js
pnpm add passkit-generator.js
```

## API

Since this is a rewrite or [`passkit-generator`](https://github.com/alexandercerutti/passkit-generator), the documentation is literally the same as the original repository : <https://github.com/alexandercerutti/passkit-generator/wiki>.

Just note that `.getAsStream()` is removed.
