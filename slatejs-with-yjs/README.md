# Testing SLATE JS Editor with YJS CRDT

**Important note:**
This package uses a customized build of @slate-yjs, which exposes some extra internal methods on top of its original ones.

To make the package run, **copy everything from ../@slate-yjs to ./node_modules/slate-yjs-mkr/**

**PROXY:**
This package uses a proxy to communicate to reunion's ActiveSync. Proxy's purpose is to fix browser's CORS policy.
- **To install the proxy:** npm install -g local-cors-proxy
- **To run the proxy:** lcp --proxyUrl https://reunion.demo.octopus-news.com


