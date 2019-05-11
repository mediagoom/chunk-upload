const path = require('path');
const expect   = require('chai').expect;
const uplaoder = require('../../src/server');
const filemanager = require('../../src/core/filemanager');
const CRC32    = require('../../src/core/crc').CRC32;
const App      = require('./app');
const Simulator = require('./simulate');


function crc(buffer)
{
    const crc32 = new CRC32();
    crc32.update(buffer);
    const crc = crc32.finalize();

    return crc;
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

        });    

        after( ()=> {/*server.close();*/} );
    
    
        it('check it validly upload', async () => {
       
            const fm = new filemanager(path.normalize(path.join(process.cwd(), config.base_path)));
            const filename = './broken.mp4';

            fm.delete(filename);

            let res = await simulator.valid();

                
            expect(res.status).to.be.eq(200, 'valid');
            //expect(res.body.length).to.be.above(1);



            expect( await fm.size(filename) ).to.be.eq(30);

            const crc1 = crc( await fm.read(filename, 0, 30) );

            //dbg('crc', crc1);

            expect(0x2d5c0794).to.be.eq(crc1);

        });

        it('check broken end'/*, async () => {
       
        let res = await simulator.broken_start();
            
        
        expect(res.status).to.be.above(399, 'broken end');
        //expect(res.body.length).to.be.above(1);

       
    }*/);

        it('check invalid size', async () => {
       
            let res = await simulator.invalid_size();
        
            expect(res.status).to.be.above(399, 'invalid size');
       
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

                expect(err.message).to.match(/aborted/);

                events['data'](); //should not do anything since completed
                events['end'](); //should not do anything since completed
                events['aborted'](); //should not do anything since completed
                //events['aborted'](); //should not do anything since completed

                done();
            });

            events['aborted']();

        });
    });

});
