[![Build Status](https://travis-ci.org/mediagoom/chunk-upload.svg?branch=master)](https://travis-ci.org/mediagoom/chunk-upload)

[![codecov](https://codecov.io/gh/mediagoom/chunk-upload/branch/master/graph/badge.svg)](https://codecov.io/gh/mediagoom/chunk-upload)

[![Coverage Status](https://coveralls.io/repos/github/mediagoom/chunk-upload/badge.svg?branch=master)](https://coveralls.io/github/mediagoom/chunk-upload?branch=master)

# chunk-upload

Browser to node.js chunked uploader

This module has three components:
- A server side express middleware to receive chunks
- A client module which can be used in both nodejs or the browser
- A ui component to be used in the browser


In order to see a working sample:

```javascript
npm install
npm run build
npm run server
```

Open your browser in http://localhost:3000/index.html

In order to use chunk-upload in your project run:

```bash
npm i -S @mediagoom/chunk-upload
```
