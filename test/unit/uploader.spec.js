const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-uploader');
const chunk    = require('../../src/client.js');
const fake     = require('./fake');


function create_storage_uploader(http_request, chunk_size)
{
    const file = new fake.FakeFile();
    const storageKey = `${file.name}-${file.lastModified}-${file.size}`;
    
    if(undefined === chunk_size)
        chunk_size = fake.chunk_size;
    
    const storage = new fake.FakeStorage();
    
    if(0 < chunk_size)
        storage.setItem(storageKey , JSON.stringify({position : fake.chunk_size, chunk : fake.chunk_size} ));

    if(-2 === chunk_size)
        storage.setItem(storageKey , 'i am not json');
    
    if(-3 === chunk_size)
        storage.setItem(storageKey , JSON.stringify({ chunk_size })); 

    const opts = {
        http_request : ( ) => {return http_request;}
        , chunk_size 
        , storage  
        
    };        

    const uploader = new chunk.default(file, opts);

    return uploader;
}


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

    it('should have default http_request', () => {
        const uploader = new chunk.default({name : 'mike'});
        const request = uploader.http_request();

        expect(request).to.be.not.null;
    });

    it('should chunk and upload a file from storage recovery',  (  ) => {

        return new Promise((resolve, reject) => {

            try{
                const http_request = new fake.FakeRequest();                
                const uploader = create_storage_uploader(http_request);
                
                uploader.on('storageInitialized', (p) => {
                    try{
                        expect(p).to.be.eq(fake.chunk_size);
                        uploader.start();
                    }catch(err)
                    {
                        reject(err);
                    }
                });

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

                        expect(http_request.size).to.be.eq(fake.fake_total_size - fake.chunk_size, 'fake_total_size');
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
                
                //uploader.start();
                //uploader.pause();
                
                
                //expect(uploader.paused()).to.be.true;
                

            }catch(err)
            {
                reject(err);
            }
        });

    });

    it('should handle GET failure',  (  ) => {

        return new Promise((resolve, reject) => {

            const http_request = new fake.FakeRequest('error');                
            const uploader = create_storage_uploader(http_request);

            uploader.on('error', (e) => {
                try{
                    expect(e.message).to.match(/Test Fail Get/);
                    resolve();
                }catch(err)
                {
                    reject(err);
                }
            });
        });
    });
        
    it('should handle change chunk size',  (  ) => {

        return new Promise((resolve, reject) => {

            const http_request = new fake.FakeRequest();                
            const uploader = create_storage_uploader(http_request, 12);
            

            try{
                expect(uploader.info).to.be.undefined;
                resolve();
            }catch(err)
            {
                reject(err);
            }

        });
    });
    
    it('should handle invalid crc',  (  ) => {

        return new Promise((resolve, reject) => {

            const http_request = new fake.FakeRequest('wrong_crc');                
            const uploader = create_storage_uploader(http_request);
           
            uploader.on('discardState', (reason) => {

                try{
                    expect(reason).to.match(/invalid crc/);
                    resolve();
                }catch(err)
                {
                    reject(err);
                }

            });
        });
    });
 
    it('should handle invalid status',  (  ) => {

        return new Promise((resolve, reject) => {

            const http_request = new fake.FakeRequest();                
            const uploader = create_storage_uploader(http_request);
            uploader.status = 'invalid';

            uploader.on('discardState', (reason) => {

                try{
                    expect(reason).to.match(/invalid status/);
                    resolve();
                }catch(err)
                {
                    reject(err);
                }

            });
        });
    });
 
    it('should handle missing key in storage',  (  ) => {


        const http_request = new fake.FakeRequest();                
        const uploader = create_storage_uploader(http_request, -1);


        expect(uploader.status).to.match(/initial/);

    });

    it('should handle invalid json in storage',  (  ) => {


        const http_request = new fake.FakeRequest();                
        const uploader = create_storage_uploader(http_request, -2);

        expect(uploader.status).to.match(/initial/);

    });

    it('should handle wrong json in storage',  (  ) => {


        const http_request = new fake.FakeRequest();                
        const uploader = create_storage_uploader(http_request, -3);

        expect(uploader.status).to.match(/initial/);

    });


});