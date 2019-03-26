const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-uploader');
const chunk    = require('../../src/client.js');
const fake     = require('./fake');





describe('CLIENT', () => {

    
    it('should have defaults',  ( ) => {
        
        const file = new fake.FakeFile();
        const uploader = new chunk.default(file); 

        expect(uploader._range_end).to.be.eq(file.size);
    });

    it('should support name and quit', () => {

        const file = new fake.FakeFile();

        file['webkitSlice'] = file.slice;

        new chunk.default(file); 

        file['mozSlice'] = file.slice;

        const uploader = new chunk.default(file); 

        expect(uploader.name()).eq(fake.fake_name);

        uploader.quit();

    });

    it('should handle errors', ( ) => {

        const http_request = new fake.FakeRequest(true);

        const opts = {
            http_request : ( ) => {return http_request;}
            , chunk_size : fake.chunk_size
        };
        
        const file = new fake.FakeFile();
        const uploader = new chunk.default(file, opts);

        return new Promise((resolve, reject) => {
        
            uploader.on('error', (err) => { 
                dbg(err);
                expect(err.message).to.be.eq(fake.fake_error);
                resolve();
            });
            uploader.on('complete', () => reject(new Error('should not complete')));

            uploader.start();
        
        });

    });

    it('should handle promise errors', ( ) => {

        const http_request = new fake.FakeRequest('promise');

        const opts = {
            http_request : ( ) => {return http_request;}
            , owner : 'owner'
            , id : 'id'
            , chunk_size : fake.chunk_size
        };
        
        const file = new fake.FakeFile();
        const uploader = new chunk.default(file, opts);

        return new Promise((resolve, reject) => {
        
            uploader.on('error', (err) => {
                expect(err.message).to.be.eq(fake.fake_error);
                resolve();
            });
            uploader.on('complete', () => reject());

            uploader.start();
        
        });

    });

    it('should handle invalid size', ( ) => {

        const http_request = new fake.FakeRequest();

        const opts = {
            http_request : ( ) => {return http_request;}
            , chunk_size : fake.chunk_size
        };
        
        const file = new fake.FakeFile();
        const uploader = new chunk.default(file, opts);

        uploader._range_end = fake.fake_total_size + 10;

        return new Promise((resolve, reject) => {
        
            uploader.on('error', (err) => {
                expect(err.message).to.be.eq('Invalid Range On Upload!');
                resolve();
            });
            uploader.on('complete', () => reject());

            uploader.start();
        
        });

    });

    it('should chunk and upload a file',  (  ) => {

        return new Promise((resolve, reject) => {

            try{
                
                const http_request = new fake.FakeRequest();

                const opts = {
                    http_request : ( ) => {return http_request;}
                    , chunk_size : fake.chunk_size
                };        

                const file = new fake.FakeFile();
                const uploader = new chunk.default(file, opts);
        
                uploader.on('progress', (sn) => {
                    
                    dbg('progress', sn);

                    if(uploader.paused())
                    {
                        dbg('resume');
                        uploader.resume();
                    }

                });

                uploader.on('completed', () => {
                    
                    dbg('completed', Math.trunc(fake.fake_total_size / fake.chunk_size), (fake.fake_total_size % fake.chunk_size)
                        , http_request.size,  http_request.requests);

                    try{

                        expect(http_request.size).to.be.eq(fake.fake_total_size, 'fake_total_size');
                        expect(http_request.requests).to.be.eq( 
                            Math.trunc(fake.fake_total_size / fake.chunk_size) + 
                                ( (fake.fake_total_size % fake.chunk_size)?1:0 )
                            , 'requests');

                    }catch(err)
                    {
                        reject(err);
                    }
       
                    resolve();
                });

                uploader.on('error', (err)=> {reject(err);});
                
                uploader.start();
                uploader.pause();
                
                
                expect(uploader.paused()).to.be.true;
                

            }catch(err)
            {
                reject(err);
            }
        });

    });
});