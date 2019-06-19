[![Build Status](https://travis-ci.org/mediagoom/chunk-upload.svg?branch=master)](https://travis-ci.org/mediagoom/chunk-upload) [![codecov](https://codecov.io/gh/mediagoom/chunk-upload/branch/master/graph/badge.svg)](https://codecov.io/gh/mediagoom/chunk-upload) [![Coverage Status](https://coveralls.io/repos/github/mediagoom/chunk-upload/badge.svg?branch=master)](https://coveralls.io/github/mediagoom/chunk-upload?branch=master) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/mediagoom/chunk-upload.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/mediagoom/chunk-upload/context:javascript) [![Known Vulnerabilities](https://snyk.io/test/github/mediagoom/chunk-upload/badge.svg)](https://snyk.io/test/github/mediagoom/chunk-upload) [![Greenkeeper badge](https://badges.greenkeeper.io/mediagoom/chunk-upload.svg)](https://greenkeeper.io/) 

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
## Server

After installing in your express server add:

```javascript
const uploader  = require('@mediagoom/chunk-upload');

const app = express();

app.use('/upload', uploader({base_path: <destination> + '/'}));

//this is called at the end of the upload
    
    app.put('/upload/:id?', (req, res) => {
    
        //the file path
        console.write(req.uploader);
        
        res.send('OK');

    
    });

```

## Client

To use the client module use:

```javascript
import {UploadManager} from '@mediagoom/chunk-upload/lib';
```

To use the client ui module use:

```javascript
import ui from '@mediagoom/chunk-upload/lib/ui';
```

To use the client css:

```bash

npm i -D postcss-inline-svg
npm i -D postcss-loader

```

If you use webpack in your webpack.config.js

```javascript

const inline_svg = require('postcss-inline-svg')(
    {
        paths : [
            path.normalize(path.join(__dirname, './node_modules/@mediagoom/chunk-upload/src/ui'))
        ]
    }
);

..........

           ,{
                test: /\.scss$/
                ,use: [
                    'vue-style-loader'
                    ,'css-loader'
                    , {
                        loader: 'postcss-loader'
                        ,options: {
                            ident: 'postcss'
                            ,plugins: [
                                inline_svg
                            ]
                        }
                    }
                    , { loader: 'sass-loader'}
                    , { loader: 'sass-resources-loader'
                        , options: {
                            sourceMap: true
                            ,resources: [
                                path.resolve(__dirname, './src/style/_variables.scss') 
                                , path.resolve(__dirname, './node_modules/@mediagoom/chunk-upload/src/UI/style.scss')
                                ,]
                        }
                    }
                ]
            }

```
