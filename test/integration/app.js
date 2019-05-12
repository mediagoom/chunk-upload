#!/usr/bin/env node

const express = require('express');
const dbg      = require('debug')('chunk-upload:integration-test-api');
const uploader = require('../../src/server');

const default_options= {
    root : {
        static : 'sample'
        , uploader : '/upload/:id?'
        , lib : './lib'
    }
};

function get_app(options)
{

    if(undefined === options)
    {
        options = default_options;
    }
    else
    {
        options = Object.assign({}, options, default_options);
    }

    var app = express();

    app.use(express.static(options.root.static));
    app.use('/lib', express.static(options.root.lib));

    app.use(options.root.uploader, uploader(options));

    /*
    app.get('/', function (req, res) {
    res.send('Hello World!')
    })
    */

    app.put(options.root.uploader, (req, res) => {
    
        dbg('-------------****');
        dbg(req.uploader);
        dbg('-------------**--');
    
        res.send('OK');
    
    });

    if('production' !== process.env.NODE_ENV)
    {
        app.use(function (err, req, res, next) {
            
            dbg('app-chunk-uploader-error:', err.message, res.status, '-->', JSON.stringify(err, null, 4));

            if (res.headersSent) {
                return next(err);
            }

            let statusCode = 500;

            if(err.statusCode !== undefined)
                statusCode = err.statusCode;
        
            res.status(statusCode).send(err);
        });
    }


    return app;

}

module.exports = get_app;