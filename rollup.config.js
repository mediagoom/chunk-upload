import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import built_ins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import rollup_sass from 'rollup-plugin-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
//import inliner from 'sass-inline-svg';
import sass from 'sass';
import {readFileSync} from 'fs';
import {resolve as path_resolve}  from 'path';

function svg_inline(value)
{
    const path = path_resolve('./assets', value.dartValue.a);

    //console.log('svg_inline', value.dartValue.a, path);

    const content = readFileSync(path);

    return new sass.types.String('url("data:image/svg+xml;base64,' + content.toString('base64') + '")');
}

const sass_plugin = rollup_sass({
    
    processor: css => postcss([autoprefixer])
        .process(css)
        .then(result => result.css)
    , insert: true

    //sass options
    , options: {
        functions: {
            'svg($value1)' : svg_inline
        }
    }
});



const g_plugins = [
    resolve({
        preferBuiltins: true
        , browser: true
    })
    , commonjs()
    , built_ins()
    , globals()
    , json()
    , babel({
        include : 'node_modules/superagent/**'
        , exclude: 'node_modules/**'
        , babelrc: false
        , presets: [['@babel/env', { modules: false }]]
        , plugins: ['@babel/plugin-transform-object-assign']
        , env: {
            test: {
                plugins: [ 'istanbul' ]
            }
        }
        //, externalHelpers: true
    })
];

let ui_plugins = [];
ui_plugins.push(sass_plugin);
ui_plugins = ui_plugins.concat(g_plugins);
//console.log('ui_plugins', ui_plugins.length);


/*
const g_plugins_server = [
    commonjs()
    , json()
    , babel({
        exclude: 'node_modules/**'
        , babelrc: false
        , presets: [['@babel/env', { modules: false }]]
        , plugins: ['@babel/plugin-transform-object-assign']
    })
];
*/

export default [
    /*{
        external: []
        , input: 'src/client.js'
        , output: 
      
        {
            file: 'lib/chunk-uploader.js'
            , sourcemap: true
            , format: 'iife'
            , name: 'chunkupload'
            , exports: 'named'
            , globals: []
        }
        
        , plugins: g_plugins
    }
    ,*/ {
        external: []
        , input: 'src/UI/index.js'
        , output: 
      
        {
            file: 'lib/chunk-uploader-ui.js'
            , sourcemap: true
            , format: 'iife'
            , name: 'chunkuploadui'
            , exports: 'named'
            , globals: []
        }
        
        , plugins: ui_plugins
    }
    /*, {
        external: []
        , input: 'src/client.js'

        , output: 
        {
            file: 'lib/index.js'
            , sourcemap: true
            , format: 'cjs'
            , exports: 'named'
            , globals: []
        }
    
        , plugins: g_plugins_server
    }
    , {
        external: []
        , input: 'src/server.js'
        , output: 
        {
            file: 'bin/index.js'
            , sourcemap: true
            , format: 'cjs'
            , globals: []
        }
        , plugins: g_plugins_server
    }
    , {
        external: []
        , input: 'src/test/server.js'
        , output: 
        {
            file: 'bin/server.js'
            , sourcemap: true
            , format: 'cjs'
            , globals: []
        }
        , plugins: g_plugins_server
    }
    */
    ,]
;
