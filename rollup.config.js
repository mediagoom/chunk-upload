import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';



const gplugins = [
    resolve({
        preferBuiltins: true
        , browser: true
    })
    , commonjs()
    , builtins()
    , globals()
    , json()
    , babel({
        exclude: 'node_modules/**'
        , babelrc: false
        , presets: [['@babel/env', { modules: false }]]
        , plugins: ['@babel/plugin-transform-object-assign']
        //, externalHelpers: true
    })
];

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
        
        , plugins: gplugins
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
