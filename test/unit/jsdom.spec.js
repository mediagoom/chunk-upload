//const fs      = require('fs');
//const util    = require('util');
const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-jsdom');
const jsdom = require('jsdom');
const jutil = require('jsdom/lib/jsdom/living/generated/utils');

const ui = require('../../src/UI/uploader.js');

const JSDOM  = jsdom.JSDOM;

//const read_file = util.promisify(fs.readFile);

// some hard coded html
const html = `
<!DOCTYPE html>
    <html>
    <body>
        <div id="jsdom"
    </body>
</html>`;

/*
async function add_script(window, file)
{
    const js = await read_file(file);

    // Execute library by inserting a <script> tag containing it.
    const scriptEl = window.document.createElement('script');
    scriptEl.textContent = js;
    window.document.body.appendChild(scriptEl);
}
*/

function file_reader(window/*, file*/)
{
    return new Promise( (resolve, reject) => {

        const content = '0123456789ABCDEF';

        const fileReader = new window.FileReader();
        const file = new window.File([content], 'test.txt');

        fileReader.onload = function(/*e*/) { 
            
            resolve(file); 
        };
        fileReader.onerror = function(e) { reject(e); };

        fileReader.readAsText(file);

    });
}


describe('JSDOM', () => {
    
    it('should create ui', async () => {

        const virtualConsole = new jsdom.VirtualConsole();
        virtualConsole.sendTo(console);
        
        virtualConsole.on('jsdomError', e => { throw e; });

        const window = (new JSDOM(html, { runScripts: 'dangerously'
            , virtualConsole 
            
        })).window;

        //await add_script(window, 'lib/chunk-uploader-ui.js');
        //await add_script(window, 'test/unit/jsdom.require.js');

        /*
        const div = window.document.createElement('div');

        const att = window.document.createAttribute('id');       
        att.value = 'jsdom';                           
        div.setAttributeNode(att); 
        
        window.document.body.appendChild(div);
        */
        

        const upload_manager = ui(window, 'jsdom');

        //dbg('div', div.outerHTML);

        //await add_script(window, 'test/unit/jsdom.headless.js');

        
        const file = await file_reader(window);        
        const input = window.document.getElementById(upload_manager.options.ids.file_input);
        jutil.implForWrapper(input.files).push(file);
        input.dispatchEvent(new window.Event('change'));

        //dbg('input', input.outerHTML);

        const div = window.document.getElementById('jsdom');

        dbg('div', div.outerHTML);

    });

});