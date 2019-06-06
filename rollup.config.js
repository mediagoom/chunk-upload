import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import built_ins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import rollup_sass from 'rollup-plugin-sass';
import replace from 'rollup-plugin-replace';
import autoprefixer from 'autoprefixer';
import inline_svg from 'postcss-inline-svg';
import postcss from 'postcss';
import dbgFunc from 'debug';
/**
 * debug function
 */
const dbg = dbgFunc('chunk-upload:rollup');
/**
 * This is the function to run post css from the 
 * sass plug-in
 * @param {*} css 
 * @param {*} id 
 */
function run_postcss(css, id)
{
    const options = {
        from : id
    };

    const processor =  postcss([autoprefixer, inline_svg()]);

    return new Promise((resolve, reject) =>{
        
        const lazy = processor.process(css, options);
        
        lazy.then( (result) => { 
            //debugger;
            resolve(result.css); 
        }).catch(error => { reject(error); });
    });
}
/**
 * This is the default sass configuration
 * for inserting the css in the js bundle
 */
const sass_plugin = rollup_sass({
    
    processor: run_postcss
    , insert: true
    //sass options
    , options: {
        functions: {
            //'svg-load($value1)' : svg_inline
        }
    }
});
/**
 * This is the configuration for outputting a processed
 * css for who want to process the js himself but not the css
 */
const sass_plugin_css = rollup_sass({
    processor : run_postcss
    , insert : false
    , output: 'lib/chunk-uploader.css'
    , options: { indentWidth : 4 }
});
/**
 * This is the plug-in to do some replace for 
 * better targeting the browser
 */
const resolve_plugin = replace ({
    include: '**/httprequest.js'
    , delimiters: ['', '']
    , values : {
        'const rq = require;' : 'const rq = undefined;'
        , 'require(\'superagent-proxy\')(request);' : ''
    }
});
/**
 * Common Plugins
 */
const g_plugins = [
    resolve({
        preferBuiltins: true
        , browser: true
        
    })
    , commonjs(
        {
            exclude: [ 'node_modules/superagent-proxy/**' ]
            , ignore: ['superagent-proxy']
        }
    )
    , built_ins()
    , globals()
    , json()
    , babel({
        include : ['src/**', 'node_modules/superagent/**']
        //exclude: 'node_modules/**'
        , babelrc: false
        , presets: [['@babel/env', { 
            modules: false 
            , 'targets': {
                'chrome': '58'
                ,'ie': '11'
            }
            , forceAllTransforms: true
            , useBuiltIns: 'usage'
        }]]
        , plugins: ['@babel/plugin-transform-object-assign']
        , env: {
            test: {
                plugins: [ 'istanbul' ]
            }
        }
        //, externalHelpers: true
    })
];
/**
 * UI plugin
 */
let ui_plugins = [resolve_plugin, sass_plugin];
ui_plugins = ui_plugins.concat(g_plugins);

dbg('ui_plugins', ui_plugins.length);
/**
 * The server side processing plugin
 */
const g_plugins_server = [
    resolve_plugin
    , commonjs()
    , json()
    , babel({
        exclude: 'node_modules/**'
        , babelrc: false
        , presets: [['@babel/env', { modules: false }]]
        , plugins: ['@babel/plugin-transform-object-assign']
    })
];

const g_server_external = ['events', 'superagent', 'superagent-proxy'];


export default [
    /**
     * The client side browser module without UI
     */
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
    /**
     * The client side browser module with UI
     */ 
    , {
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
    /**
     * Transpiled version for node usage
     */
    , {
        external: g_server_external 
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
    /**
     * Transpiled version for node usage with UI
     */
    ,{
        external: g_server_external
        , input: 'src/UI/uploader.js'
        , output: 
      
        {
            file: 'lib/ui.js'
            , sourcemap: true
            , format: 'cjs'
            , exports: 'named'
            , globals: []
        }
        , plugins: g_plugins_server
    }
    ,{
        input: 'src/UI/style.js'
        , plugins: [sass_plugin_css]
        , output : {format: 'iife', name: 'style', file: 'lib/empty.js'}
    }
    ,]
;
