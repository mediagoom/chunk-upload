//const fs      = require('fs');
//const util    = require('util');
const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-jsdom');
const jsdom = require('jsdom');
const jutil = require('jsdom/lib/jsdom/living/generated/utils');
const fake     = require('./fake');

const ui = require('../../src/UI/uploader.js');

const JSDOM  = jsdom.JSDOM;

//const read_file = util.promisify(fs.readFile);

// some hard coded html
const html = `
<!DOCTYPE html>
    <html>
    <body>
        <div id="jsdom" />
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
        const file = new window.File([content], 'test.txt', {lastModified : 1557990997050});

        fileReader.onload = function(/*e*/) { 
            
            resolve(file); 
        };
        fileReader.onerror = function(e) { reject(e); };

        fileReader.readAsText(file);

    });
}

async function process(window, upload_manager)
{
    const file = await file_reader(window); 

            const input = window.document.getElementById(upload_manager.options.ids.file_input);
            jutil.implForWrapper(input.files).push(file);
            input.dispatchEvent(new window.Event('change'));

            const div = window.document.getElementById('jsdom');

            dbg('div', div.outerHTML);

            let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]', window.document, null, window.XPathResult.ANY_TYPE, null); 
            el = el.iterateNext();
            expect(el).to.be.not.null;

            el = window.document.evaluate('./li[position() = 2]/a[position() = 1]', el, null, window.XPathResult.ANY_TYPE, null); 
            el = el.iterateNext();
            expect(el).to.be.not.null;

            el.dispatchEvent(new window.Event('click'));

            return el;

}


describe('JSDOM', () => {
 
    it('should create ui', () => {

        return new Promise( (resolve, reject) => {

            try{

                const virtualConsole = new jsdom.VirtualConsole();
                virtualConsole.sendTo(console);
                
                virtualConsole.on('jsdomError', e => { throw e; });

                const window = (new JSDOM(html, { runScripts: 'dangerously'
                    , virtualConsole 
                    , url : 'https://chunk.mediagoom.com'
                })).window;

                const http_request = new fake.FakeRequest(1);
                const upload_manager = ui(window, 'jsdom', {
                    http_request : () => {
                        return http_request;
                    }
                    , chunk_size : 3
                });

                const div = window.document.getElementById('jsdom');
                let count = 0;

                upload_manager.on('error', (err) => {

                    //console.log('uploader error ->', err);

                    if(0 === count)
                    {

                        count++;

                        setTimeout( () => {


                            let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                            el = el.iterateNext();

                            //console.log(div.innerHTML, '---------', el.outerHTML);
                            

                            expect(el.innerHTML).to.match(/this is a unit test error/);
                            
                            el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 2]/a[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 

                            el = el.iterateNext();
                            expect(el).to.be.not.null;

                            el.dispatchEvent(new window.Event('click'));
                            
                        }, 10);

                    }
                    else
                        reject( new Error(`uploader error ${err.message} ${count}`));

                });
                upload_manager.on('completed', 
                () => {
                    
                    const keys = Object.keys(window.localStorage);

                            expect(keys.length).to.be.eq(0);
                    resolve();
                } );
                

                upload_manager.on('progress', (p, id) => { 
                    

                    //console.log(div.outerHTML);


                    let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                            el = el.iterateNext();

                            //console.log(div.innerHTML, '---------', el.outerHTML);
                            

                            expect(el.innerHTML).to.not.match(/this is a unit test error/);

                            el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 3]/span', window.document, null, window.XPathResult.ANY_TYPE, null); 
                            el = el.iterateNext();

                            //console.log(div.innerHTML, '---------', el.outerHTML);
                            expect(el.innerHTML).to.match(/(\d\.\d\d%)|()/);

                            const keys = Object.keys(window.localStorage);

                            expect(keys.length).to.be.eq(1);

                            //console.log(el.innerHTML, keys[0], window.localStorage.getItem(keys[0]));

                } );

                process(window, upload_manager).then( () => {} ).catch( 
                    (e) => reject(e)
                );
                
                

                //dbg('div', div.outerHTML);

            }catch(err)
            {
                reject(err);
            }
        });
    });
   
    it('should handle restart', () => {

        return new Promise( (resolve, reject) => {

            try{

                const virtualConsole = new jsdom.VirtualConsole();
                virtualConsole.sendTo(console);
                
                virtualConsole.on('jsdomError', e => { throw e; });

                const window = (new JSDOM(html, { runScripts: 'dangerously'
                    , virtualConsole 
                    , url : 'https://chunk.mediagoom.com'
                })).window;

                
        //storage.setItem(storageKey , JSON.stringify({position : fake.chunk_size, chunk : fake.chunk_size} ));

                const http_request = new fake.FakeRequest();
                const upload_manager = ui(window, 'jsdom', {
                    http_request : (opts) => {

                        http_request.validate(expect, opts);
        

                        return http_request;
                    }
                    , chunk_size : 3
                    , storage : new fake.FakeStorage({
                        "test.txt-1557990997050-16" : JSON.stringify({"position":9,"chunk":3})
                    })
                });

                const div = window.document.getElementById('jsdom');
                let count = 0;

                upload_manager.on('error', (err) => {

                    
                        reject( new Error(`uploader error ${err.message} ${count}`));

                });
                upload_manager.on('completed', () => resolve() );
                

                upload_manager.on('progress', (p, id) => { 
                    

                } );

                process(window, upload_manager).then( () => {} ).catch( 
                    (e) => reject(e)
                );

            }catch(err)
            {
                reject(err);
            }
        });

    });

});