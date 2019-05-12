const path = require('path');
const expect   = require('chai').expect;
const uplaoder = require('../../src/server');
const filemanager = require('../../src/core/filemanager');
const CRC32    = require('../../src/core/crc').CRC32;
const App      = require('./app');
const Simulator = require('./simulate');

const target_crc = 0x2d5c0794;
const buffer = new Buffer('012345678901234567890123456789');

function crc(buffer)
{
    const crc32 = new CRC32();
    crc32.update(buffer);
    const crc = crc32.finalize();

    return crc;
}



async function validly(fm, simulator, filename)
{
    let res = await simulator.valid();
                
    expect(res.status).to.be.eq(200, 'valid');

    const exist = await fm.is_file(filename);

    expect( exist ).to.be.true;

    const size = await fm.size(filename) ;

    expect( size ).to.be.eq(30);

    const crc1 = crc( await fm.read(filename, 0, 30) );

    expect(target_crc).to.be.eq(crc1);
}



describe('API-TEST', () => {

    describe('APP', () => {

        let server = null;
        let simulator = null;

        let config = { 
            uploader : '/upload'
            , base_path : './uploader/'
        };
        
        before(async () => { 
        
            const app = App(config);
            server = app;

            simulator = Simulator(server, config.uploader, expect);

            const fm = new filemanager(process.cwd());
            fm.create_dir(config.base_path);

        });    

        after( ()=> {/*server.close();*/} );
    
        
        it('check it truncate', async () => {
             
            let res = await simulator.valid(2);
            expect( res.status ).to.be.eq(200);

        });
        
        it('check it validly upload', async () => {
       
            const fm = new filemanager(path.normalize(path.join(process.cwd(), config.base_path)));
            const filename = './broken.mp4';
            
            await fm.delete(filename);

            await validly(fm, simulator, filename);
            
            //do it twice second time should auto delete file
            await validly(fm, simulator, filename);

        });

        it('should get information', async () => {

            const fm = new filemanager(path.normalize(path.join(process.cwd(), config.base_path)));
            const filename = './broken.mp4';
            
            await fm.delete(filename);

            await fm.write(filename, 0, buffer);
            
            let res = await simulator.info();
        
            expect(res.status).to.be.eq(200);
            expect(res.body.crc32).to.be.eq(target_crc);
        });

        it('should post information', async () => {

            const fm = new filemanager(path.normalize(path.join(process.cwd(), config.base_path)));
            const filename = './broken.mp4.json';
            
            await fm.delete(filename);
            
            let res = await simulator.post();
        
            expect(res.status).to.be.eq(200);

            const exist = await fm.is_file(filename);

            expect( exist ).to.be.true;

            const size = await fm.size(filename);

            const info = await fm.read(filename, 0, size);

            //console.log(info.toString());

            const j = JSON.parse(info.toString());

            expect(j.hello).to.be.eq('world');

        });

        it('check broken end', async () => {
       
            const fm = new filemanager(path.normalize(path.join(process.cwd(), config.base_path)));
            const filename = './broken.mp4';

            await fm.delete(filename);

            let res = await simulator.broken_start();
        
            expect(res.status).to.be.above(399, 'broken end');
       
        });

        it('check invalid size', async () => {
       
            let res = await simulator.invalid_size();
        
            expect(res.status).to.be.above(399, 'invalid size');
       
        });

        it('handle error', async () => {
            
            let wrong = { 
                uploader : '/upload'
                , base_path : './mike_mouse/'
            };

            const callback = App(wrong);

            const simul = Simulator(callback, wrong.uploader, expect);

            const res = await simul.valid();

            expect(res.status).to.be.eq(500);

        });

    });

    describe('SERVER-DIRECT', () => {
        
        it('handle null options', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                headers : {}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/Missing file-name/);


                done();
            });

        });

        it('handle missing file', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                headers : {'content-range' : 'bytes 0-10/30'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/Missing file-name/);


                done();
            });

        });

        it('handle abort', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                headers : {'content-range' : 'bytes 0-10/30', 'file-name' : 'mike'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/abort/);

                events['data'](); //should not do anything since completed
                events['end'](); //should not do anything since completed
                events['aborted'](); //should not do anything since completed

                done();
            });

            events['aborted']();

        });

        it('handle limit', (done) => {

            const callback = uplaoder({limit : 2});
            const events = {};

            const req = {
                headers : {'content-range' : 'bytes 0-10/30', 'file-name' : 'mike'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/request entity too large/);

                events['data'](); //should not do anything since completed
                events['end'](); //should not do anything since completed
                events['aborted'](); //should not do anything since completed

                done();
            });

            events['data'](Buffer.from('0123456789'));

        });
        
        it('handle end error ', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                headers : {'content-range' : 'bytes 0-10/30', 'file-name' : 'mike'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/Test Error/);

                events['data'](); //should not do anything since completed
                events['end'](); //should not do anything since completed
                events['aborted'](); //should not do anything since completed

                done();
            });

            events['data'](Buffer.from('0123456789'));
            events['end']( new Error('Test Error'));
            

        });

                
        it('handle post error ', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                method : 'POST'
                , headers : {'content-range' : 'bytes 0-10/30', 'file-name' : 'mike'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                expect(err.message).to.match(/Missing Content-Length/);


                done();
            });

            

        });

        it('handle get error ', (done) => {

            const callback = uplaoder();
            const events = {};

            const req = {
                method : 'GET'
                , headers : {'content-range' : 'bytes 0-10/30', 'file-name' : 'mike'}
                , removeListener : () => {}
                , on : (event, func) => {
                    events[event] = func;
                }
            };
            const res = { 
                end : () => {done();}
            };

            callback(req, res, (err) => {

                //console.log(err);
                try{
                    expect(err.message).to.match(/cannot read a non-file/);
                }catch(e)
                {
                    done(e);
                    return;
                }

                done();
            });

        });
    });
});
