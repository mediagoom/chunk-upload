import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';

const gglobals = {
    
};

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

const g_plugins_server = gplugins.slice(0);
g_plugins_server[0] = resolve({preferBuiltins : true, browser : false});

export default [
    {
        external: []
        , input: 'src/client.js'
        , output: 
      
        {
            file: 'lib/chunk-uploader.js'
            , sourcemap: true
            , format: 'iife'
            , name: 'mgPlay'
            , globals: gglobals
        }
        
        , plugins: gplugins
    }
    , {
        external: []
        , input: 'src/client.js'

        , output: 
        {
            file: 'lib/index.js'
            , sourcemap: true
            , format: 'cjs'
            , globals: gglobals
        }
    
        , plugins: gplugins
    }
    , {
        external: []
        , input: 'src/server.js'
        , output: 
        {
            file: 'bin/index.js'
            , sourcemap: true
            , format: 'cjs'
            , globals: gglobals
        }
        , plugins: g_plugins_server
    }
    ,]
;
