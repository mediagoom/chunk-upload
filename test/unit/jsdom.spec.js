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
    let e = undefined;

    if(undefined === event)
        event = 'click';

    if((typeof event) === 'string' )
        e = new target.ownerDocument.defaultView.Event(event);
    else
        e = event;

    return new Promise((resolve, reject) => {
        try{
            target['resolver'] = resolve;

            target.addEventListener(e.type, jsdom_event_target);
            target.dispatchEvent(e);

        }catch(e){reject(e);}
    });
}

function jsdom_xpath(win, xpath, parent)
{
    if(undefined === parent)
        parent = win.document;

    let el = win.document.evaluate(xpath, parent, null, win.XPathResult.ANY_TYPE, null); 
    el = el.iterateNext();
    
    return el;
}

function upm_event(event_manager, args, type)
{

    if(null !== event_manager.resolver)
    {
        const resolve = event_manager.resolver;
        event_manager.resolver = null;

        resolve({args, type});

        return;
    }

    event_manager.events.push({args, type}); 

}

function upm_event_wait(upm)
{
    return new Promise( (resolve, reject) => {
        if(0 < upm.event_manager.events.length)
        {
            const ev = upm.event_manager.events[0];
            upm.event_manager.events = upm.event_manager.events.slice(1);

            resolve(ev);
        }
        else
        {
            upm.event_manager.resolver = resolve;
        }
    });
}

function upm_event_prepare(upm)
{
    if(undefined !== upm.event_manager)
        return;
    
    upm.event_manager = {
        resolver : null
        , events : []
    };

    upm.on('error', () => { upm_event(upm.event_manager, arguments, 'error'); });

    upm.on('progress', () => { upm_event(upm.event_manager, arguments, 'progress'); });
    upm.on('completed', () => { upm_event(upm.event_manager, arguments, 'completed'); });
}


function file_reader(window, name)
{

    if(undefined === name)
        name = 'test.txt';

    return new Promise( (resolve, reject) => {

        const content = '0123456789ABCDEF';

        const fileReader = new window.FileReader();
        const file = new window.File([content], name, {lastModified : 1557990997050});

        fileReader.onload = function(/*e*/) { 
            
            resolve(file); 
        };
        fileReader.onerror = function(e) { reject(e); };

        fileReader.readAsText(file);

    });
}

async function process(window, upload_manager, name, reset, position)
{
    const file = await file_reader(window, name);

    const input = window.document.getElementById(upload_manager.options.ids.file_input);

    let target = 1;

    if(undefined !== position)
        target = position;

    if(true === reset)
        while(jutil.implForWrapper(input.files).length)
        {
            jutil.implForWrapper(input.files).pop();
        }
    
    await jsdom_event(input);

    jutil.implForWrapper(input.files).push(file);
    //input.dispatchEvent(new window.Event('change'));

    await jsdom_event(input, 'change');

    const div = window.document.getElementById('jsdom');

    dbg('div', div.outerHTML);
    /*
    let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]', window.document, null, window.XPathResult.ANY_TYPE, null); 
    el = el.iterateNext();
    expect(el).to.be.not.null;

    el = window.document.evaluate('./li[position() = 2]/a[position() = 1]', el, null, window.XPathResult.ANY_TYPE, null); 
    el = el.iterateNext();
    expect(el).to.be.not.null;
    */
    let el = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]/..');
    el = jsdom_xpath(window, './ul[position() = ' + target.toString() + ']/li[position() = 2]/a[position() = 1]', el);
        
    //el.dispatchEvent(new window.Event('click'));
    await jsdom_event(el);

    return el;

}


async function process2(window, upload_manager, name, reset, position)
{
    const file = await file_reader(window, name);

    const area = window.document.getElementById(upload_manager.options.ids.upload_area);

    let target = 1;

    if(undefined !== position)
        target = position;

    const drop = new area.ownerDocument.defaultView.Event('drop');
    drop.dataTransfer = {files : [file]};

    await jsdom_event(area, drop);
    
    let el = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]/..');
    el = jsdom_xpath(window, './ul[position() = ' + target.toString() + ']/li[position() = 2]/a[position() = 1]', el);
        
    //el.dispatchEvent(new window.Event('click'));
    await jsdom_event(el);

    return el;

}

function WIN()
{
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.sendTo(console);
                
    virtualConsole.on('jsdomError', e => { throw e; });

    const w = (new JSDOM(html, { runScripts: 'dangerously'
        , virtualConsole 
        , url : 'https://chunk.mediagoom.com'
    })).window;

    w.alert = () => {};

    return w;
}


describe('JSDOM', () => {
    let window = undefined;

    const http_request = new fake.FakeRequest();
    
    beforeEach(() =>{

        

        window = WIN();

    });

 
    describe('Uploader', () =>{
   
        it('should create ui', async () => {

            //let create a request which will throw once
            const http_request = new fake.FakeRequest(1);
            const upload_manager = ui(window, 'jsdom', {
                http_request : () => {
                    return http_request;
                }
                , chunk_size : 3
            });

            upm_event_prepare(upload_manager);

            const styled = window.document.getElementById(upload_manager.options.ids.styled_file);

            await jsdom_event(styled);

            await process(window, upload_manager);
                    
            let w = true;
            let count = 0;
            let progress = 0;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);
                if('error' === ev.type)
                {
                    expect(count++).to.be.equal(0);

                    let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                    el = el.iterateNext();

                    expect(el.innerHTML).to.match(/this is a unit test error/);
                            
                    el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 2]/a[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                    el = el.iterateNext();
                    expect(el).to.be.not.null;
                    
                    //re-click start button
                    jsdom_event(el);

                    continue;
                        
                }
                    
                expect(['completed', 'progress']).to.be.include(ev.type);
                
                if('completed' === ev.type)
                {
                    //we are processing completed before the file uploader
                    upm_event_prepare(upload_manager);
                    expect(progress).to.be.greaterThan(0);
                    expect(count).to.be.greaterThan(0);
                    return;
                }

                let el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 4]/div[position() = 1]', window.document, null, window.XPathResult.ANY_TYPE, null); 
                el = el.iterateNext();

                expect(el.innerHTML).to.not.match(/this is a unit test error/);

                el = window.document.evaluate('//ul[@class = "__uploader_file_list"]/li[position() = 3]/span', window.document, null, window.XPathResult.ANY_TYPE, null); 
                el = el.iterateNext();

                expect(el.innerHTML).to.match(/(\d\.\d\d%)|()/);

                const keys = Object.keys(window.localStorage);

                expect(keys.length).to.be.eq(1);
                progress++;
            }

            //let's wait after the file process the completed
            const ev = await upm_event_wait(upload_manager);

            expect(ev.type).to.be.eq('completed');

            const keys = Object.keys(window.localStorage);

            expect(keys.length).to.be.eq(0);
        });
   
        it('should handle restart', async () => {

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

            upm_event_prepare(upload_manager);

            await process(window, upload_manager);

            let w = true;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);
                //console.log(ev.type);

                expect(['completed', 'progress']).to.be.include(ev.type);
                

                if('completed' === ev.type)
                    w = false;
            }

        });

        it('should handle pause and quit', async ()=>{
            
            http_request.wait = 1;
            
            const upload_manager = ui(window, 'jsdom', {
                http_request : (opts) => {

                    http_request.validate(expect, opts);

                    return http_request;
                }
                , chunk_size : 3
            });

            upm_event_prepare(upload_manager);
            await process(window, upload_manager);

            let w = true;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);

                expect(['progress']).to.be.include(ev.type);

                let pause = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]');
                expect(pause).not.to.be.null;
                const quite = jsdom_xpath(window, './li[position() = 2]/a[position() = 2]', pause);
                pause = jsdom_xpath(window, './li[position() = 2]/a[position() = 1]', pause);

                await jsdom_event(pause);

                //console.log(pause.innerHTML);
                expect(pause.children[1].innerHTML).to.match(/start/);

                await jsdom_event(quite);

                w = false;
            }

            const div = window.document.getElementById('jsdom');
            //redraw
            ui(window, div);
        });

        it('should re-create ui', async () => {

            //let's create a request which will throw once
            const http_request = new fake.FakeRequest(1);
            const upload_manager = ui(window, 'jsdom', {
                http_request : () => {
                    return http_request;
                }
                , chunk_size : 3
            });

            upm_event_prepare(upload_manager);

            const div = window.document.getElementById('jsdom');

            await process2(window, upload_manager, 'error.txt');
                    
            let parent = null;
            let w = true;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);
                expect(['error']).to.be.include(ev.type);

                //redraw error
                div.innerHTML = '';
                //redraw
                ui(window, div);

                parent = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]/..');
                expect(parent).not.to.be.null;

                const setting = jsdom_xpath(window, './ul[position() = 1]/li[position() = 2]/a[position() = 3]', parent);
                expect(setting).not.to.be.null;
                await jsdom_event(setting);
                
                //console.log('*****1.0', parent.outerHTML);
                const quite = jsdom_xpath(window, './ul[position() = 1]/li[position() = 2]/a[position() = 2]', parent);
                expect(quite).not.to.be.null;
                await jsdom_event(quite);

                const msg = jsdom_xpath(window, './ul[position() = 1]/li[position() = 4]', parent); 
                //console.log('*****1.1', msg.outerHTML);

                //TODO:
                //expect(msg.classList.contains(upload_manager.options.class.hidden)).to.be.false;
                        
                await process(window, upload_manager, 'pause.txt', true, 2);

                //console.log('*****1.2', parent.innerHTML);
                w = false;
            }

            w = true;

            let count = 0;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);
                
                expect(['progress']).to.be.include(ev.type);


                //console.log('****2', parent.innerHTML);
                const pause = jsdom_xpath(window, './ul[position() = 2]/li[position() = 2]/a[position() = 1]', parent);
                expect(pause).not.to.be.null;
                
                //console.log('****2.1', parent.innerHTML);

                if(0 === count)
                {
                    await jsdom_event(pause);
                    expect(pause.innerHTML).to.match(/<span>start<\/span>/);

                    await process(window, upload_manager, 'completed.txt', true, 3);
                    expect(pause.innerHTML).to.match(/<span>start<\/span>/);
                    count++;
                }
                else
                    w = false;

                
                expect(pause.innerHTML).to.match(/<span>start<\/span>/);
                expect(pause.nextElementSibling.class).not.match(/hidden/);
                
            }

            w = true;

            while(w)
            {
                const ev = await upm_event_wait(upload_manager);
                
                expect(['progress', 'completed']).to.be.include(ev.type);

                //console.log('****3', parent.innerHTML);
                
                if(ev.type === 'completed')
                    w = false;
            }

            //console.log('****4', parent.innerHTML);    

            const pause = jsdom_xpath(window, './ul[position() = 2]/li[position() = 2]/a[position() = 1]', parent);
            expect(pause).not.to.be.null;
            expect(pause.innerHTML).to.match(/<span>start<\/span>/);
            expect(pause.parentElement.nextElementSibling.classList.contains('__uploader_hidden')).to.be.false;

            const completed = jsdom_xpath(window, './ul[position() = 3]/li[position() = 2]/a[position() = 1]', parent);
            expect(completed).not.to.be.null;

            
            expect(completed.parentElement.nextElementSibling.classList.contains('__uploader_hidden')).to.be.true;
                      
            

            div.innerHTML = '';
            expect(div.innerHTML).to.be.eq('');

            parent = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]/..', div);
            expect(parent).to.be.null;
            
            //redraw
            ui(window, div);
            
            //console.log(div.innerHTML);

            parent = jsdom_xpath(window, '//ul[@class = "__uploader_file_list"]/..', div);
            expect(parent).not.to.be.null;

        });
    });

    describe('Dialog', ()=> {

        it('should open and close dialog', () => {

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
                    
            expect(div.classList.contains('cud-modal-close')).to.be.true;

        });

        it('should handle option dialog', async () => {

            const upload_manager = ui(window, 'jsdom', {
                http_request : () => {
                    return http_request;
                }
            });

            //const div = window.document.getElementById('jsdom');

            //const options = jsdom_xpath(window, './div/div/div', div);
 
                    
            const open = window.document.getElementById('cu_manager_options_open');

            const dlg = window.document.getElementById('cu_manager_options_dialog');
            const ok  = window.document.getElementById('cu_manager_options_save');
            const cancel = window.document.getElementById('cu_manager_options_cancel');
            const size = window.document.getElementById('cu_manager_options_chunk_size');
            const chunk_size = upload_manager.Options.chunk_size;

            expect(open.parentElement.classList.contains('cu-manager-options')).to.be.true;
            expect(dlg.classList.contains('cud-modal-close')).to.be.true;

            //here dialog open
            await jsdom_event(open, 'click');
                     
            expect(dlg.classList.contains('cud-modal-close')).to.be.false;
            expect(size.value).to.be.eq(chunk_size.toString());

            //cancel dialog
            await jsdom_event(cancel);

            expect(dlg.classList.contains('cud-modal-close')).to.be.true;

            //re-open dialog 
            await jsdom_event(open);
                                        
            size.value = '5';
            //click ok
            await jsdom_event(ok);

            expect(upload_manager.Options.chunk_size).to.be.eq(5);
                    

        });
        
        it('should handle invalid id', () => {

            expect( () => ui(window, 'tony') ).to.throw(/invalid container/);
                
        });

 
    });
});