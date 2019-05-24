const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-jsdom');
const jsdom    = require('jsdom');
const jutil    = require('jsdom/lib/jsdom/living/generated/utils');
const ui       = require('../../src/UI/uploader.js');
const dialog   = require('../../src/UI/dialog.js');
const fake     = require('./fake');

const JSDOM  = jsdom.JSDOM;

// some hard coded html
const html = `
<!DOCTYPE html>
    <html>
    <body>
        <div id="jsdom"></div>
    </body>
</html>`;

function jsdom_event_target(ev)
{
    const target = ev.srcElement;
    const event = ev.type;
    const resolve = target['resolver'];

    target.removeEventListener(event, jsdom_event_target);

    resolve();
}

function jsdom_event(target, event)
{
    
    return new Promise((resolve, reject) => {
        try{
            target['resolver'] = resolve;

            target.addEventListener(event, jsdom_event_target);
            target.dispatchEvent(new target.ownerDocument.defaultView.Event(event));

        }catch(e){reject(e);}
    });
}


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
    let window = undefined;

    const http_request = new fake.FakeRequest(1);
    
    beforeEach(() =>{

        const virtualConsole = new jsdom.VirtualConsole();
        virtualConsole.sendTo(console);
                
        virtualConsole.on('jsdomError', e => { throw e; });

        window = (new JSDOM(html, { runScripts: 'dangerously'
            , virtualConsole 
            , url : 'https://chunk.mediagoom.com'
        })).window;

    });

 
    describe('Uploader', () =>{
   
        it('should create ui', () => {

            return new Promise( (resolve, reject) => {

                try{

                    const upload_manager = ui(window, 'jsdom', {
                        http_request : () => {
                            return http_request;
                        }
                        , chunk_size : 3
                    });

                    let count = 0;

                    upload_manager.on('error', (err) => {

                        if(0 === count)
                        {

                            count++;

                            setTimeout( () => {

                                let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                                el = el.iterateNext();

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

                    upload_manager.on('completed', () => {
                    
                        const keys = Object.keys(window.localStorage);

                        expect(keys.length).to.be.eq(0);
                        resolve();
                    } );
                

                    upload_manager.on('progress', (/*p, id*/) => { 
                    

                        let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                        el = el.iterateNext();

                        expect(el.innerHTML).to.not.match(/this is a unit test error/);

                        el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 3]/span', window.document, null, window.XPathResult.ANY_TYPE, null); 
                        el = el.iterateNext();

                        expect(el.innerHTML).to.match(/(\d\.\d\d%)|()/);

                        const keys = Object.keys(window.localStorage);

                        expect(keys.length).to.be.eq(1);


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
   
        it('should handle restart', () => {

            return new Promise( (resolve, reject) => {

                try{


                    const http_request = new fake.FakeRequest();
                    const upload_manager = ui(window, 'jsdom', {
                        http_request : (opts) => {

                            http_request.validate(expect, opts);
        

                            return http_request;
                        }
                        , chunk_size : 3
                        , storage : new fake.FakeStorage({
                            'test.txt-1557990997050-16' : JSON.stringify({'position':9,'chunk':3})
                        })
                    });


                    upload_manager.on('error', (err) => {

                        reject( new Error(`uploader error ${err.message} `));

                    });
                    upload_manager.on('completed', () => resolve() );

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

    describe('Dialog', ()=> {

        it('should open and close dialog', () => {

            return new Promise( (resolve, reject) => {

                try{

                    const div = window.document.getElementById('jsdom');
                    const body = window.document.body;
                    
                    expect(div.innerHTML).to.be.eq('');
                    expect(body.childElementCount).to.be.eq(1);

                    const d1 = dialog(window, 'jsdom');

                    expect(body.childElementCount).to.be.eq(2);                    
                    
                    const last = body.lastElementChild;

                    expect(last).not.to.be.undefined;
                    expect(last.tagName).to.be.eq('DIV');
                    
                    expect(last.classList.contains('cud-modal-close')).to.be.true;


                    expect(body.childElementCount).to.be.eq(2);                    

                    d1.open();

                    expect(last.classList.contains('cud-modal-close')).to.be.false;

                    d1.close();
                    d1.close();

                    expect(last.classList.contains('cud-modal-close')).to.be.true;

                    const div2 = window.document.createElement('div'); 
                    const att = window.document.createAttribute('id');       
                    att.value = 'd2';  

                    div2.setAttributeNode(att);
                    body.appendChild(div2);

                    expect(body.childElementCount).to.be.eq(3);

                    const d2 = dialog(window, div2, {});

                    expect(div2.classList.contains('cud-modal-close')).to.be.true;
                    expect(div.classList.contains('cud-modal-close')).to.be.true;
                    d2.open(); 
                    expect(div2.classList.contains('cud-modal-close')).to.be.false;

                    //console.log(body.innerHTML);
                    
                    expect(div.classList.contains('cud-modal-close')).to.be.true;
                    
                    resolve();


                }catch(err)
                {
                    reject(err);
                }
            });
        });

        it('should handle option dialog', () => {

            return new Promise( (resolve, reject) => {

                try{

                    const upload_manager = ui(window, 'jsdom', {
                        http_request : () => {
                            return http_request;
                        }
                    });

                    const div = window.document.getElementById('jsdom');
                    const body = window.document.body;

                    const upl = div.firstElementChild;

                    expect(upl.childElementCount).to.be.greaterThan(4);
                    
                    const open = window.document.getElementById('cu_manager_options_open');

                    const dlg = window.document.getElementById('cu_manager_options_dialog');
                    const ok  = window.document.getElementById('cu_manager_options_save');
                    const cancel = window.document.getElementById('cu_manager_options_cancel');
                    const size = window.document.getElementById('cu_manager_options_chunk_size');
                    const chunk_size = upload_manager.Options.chunk_size;

                    expect(open.parentElement.classList.contains('cu-manager-options')).to.be.true;
                    expect(upl.children[4].classList.contains('cud-modal-close')).to.be.true;
                    
                    let do_cancel = true;

                    //here dialog open
                    jsdom_event(open, 'click').then( () => {
                    //open.addEventListener('click', () => {
                    //setTimeout( () => { 
                        try{
                         
                     
                            expect(dlg.classList.contains('cud-modal-close')).to.be.false;
                            expect(size.value).to.be.eq(chunk_size.toString());

                            if(do_cancel)
                            {
                                cancel.addEventListener('click', () => {
                                    

                                    expect(dlg.classList.contains('cud-modal-close')).to.be.true;
                                    
                                    //resolve();
                                    do_cancel = false;

                                    //re-open dialog 
                                    //open.dispatchEvent(new window.Event('click'));

                                    
                                    jsdom_event(open, 'click').then( () => {
                                        
                                        ok.addEventListener('click', () => {
                                
                                            console.log(dialog.outerHTML);

                                            expect(upload_manager.Options.chunk_size).to.be.eq(5);
                                    
                                            resolve();
                                        });
                                
                                        size.value = '5';
                                        ok.dispatchEvent(new window.Event('click'));
                                    });
                                });

                                cancel.dispatchEvent(new window.Event('click'));
                            }
                            else
                            {
                                
                                ok.addEventListener('click', () => {
                                
                                    console.log(dialog.outerHTML);

                                    expect(upload_manager.Options.chunk_size).to.be.eq(5);
                                    
                                    resolve();
                                });
                                
                                size.value = '5';
                                ok.dispatchEvent(new window.Event('click'));
                            }

                        }catch(e){reject(e);}
                    //}, 10);
                    });
                    
                    //click on open dialog 
                    //open.dispatchEvent(new window.Event('click'));
                    


                }catch(err)
                {
                    reject(err);
                }
            });

        });
 
    });
});