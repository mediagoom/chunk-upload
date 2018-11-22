import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import built_ins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import sass from 'rollup-plugin-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

const sass_plugin = sass({
    
    processor: css => postcss([autoprefixer])
        .process(css)
        .then(result => result.css)
    , insert: true
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
        exclude: 'node_modules/**'
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
console.log('ui_plugins', ui_plugins.length);


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
    {
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
    , {
        external: []
        , input: 'src/ui/index.js'
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
