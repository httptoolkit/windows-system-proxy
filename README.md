# Windows-System-Proxy [![Build Status](https://github.com/httptoolkit/windows-system-proxy/workflows/CI/badge.svg)](https://github.com/httptoolkit/windows-system-proxy/actions) [![Available on NPM](https://img.shields.io/npm/v/windows-system-proxy.svg)](https://npmjs.com/package/windows-system-proxy)

> _Part of [HTTP Toolkit](https://httptoolkit.tech): powerful tools for building, testing & debugging HTTP(S)_

Access the Windows system proxy settings from Node.js. Use it like so:

```javascript
import { getWindowsSystemProxy } from 'windows-system-proxy';

const proxy = await getWindowsSystemProxy();
```