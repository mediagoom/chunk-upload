const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-uploader');
const chunk    = require('../../src/client.js');

const chunk_size = process.env['CHUNK-SIZE'] || 50;
const fake_total_size = process.env['FAKE-SIZE'] || 220;

class FakeRequest {
    
    constructor()
    {
        this.size = 0;
        this.requests = 0;
        
    }

    put(uri, body)
    {
        dbg('PUT', uri, body.length);

        this.size += body.length;
        this.requests++;

        return new Promise( (resolve/*, reject*/) => {resolve( {status: 200} );});
    }
}

//lastModified: 1552660384979
//lastModifiedDate: Date 2019-03-15T14:33:04.979Z
//name: "CaptureFormat.exe"
//size: 11776
//type: "application/x-msdownload"

class FakeFile{

    constructor(file_path, name)
    {
        dbg('FAKE-FILE', file_path);

        this.Name = 'FAKE';
        this.Path = '../src/test/mediagoom.jpg';

        if(undefined != name)
            this.Name = name;

        if(undefined != file_path)
            this.Path = file_path;
    }

    slice(start, end)
    {
        dbg('slice', start, end);

        expect(end - start).not.be.above(chunk_size);

        return new Array(end - start);
    }

    get size()
    {
        return fake_total_size;
    }

    get name(){return this.Name;}

}

describe('CLIENT', () => {

    
    it('should have defaults',  ( ) => {
        const file = new FakeFile();
        const uploader = new chunk.default(file); 

        expect(uploader._range_end).to.be.eq(file.size);
    });

    it('should chunk and upload a file',  (  ) => {

        return new Promise((resolve, reject) => {

            try{
                const http_request = new FakeRequest();

                const opts = {
                    http_request : ( ) => {return http_request;}
                    , chunk_size
                };        

                const file = new FakeFile();
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
                    
                    dbg('completed', Math.trunc(fake_total_size / chunk_size), (fake_total_size % chunk_size)
                        , http_request.size,  http_request.requests);

                    try{

                        expect(http_request.size).to.be.eq(fake_total_size, 'fake_total_size');
                        expect(http_request.requests).to.be.eq( 
                            Math.trunc(fake_total_size / chunk_size) + 
                                ( (fake_total_size % chunk_size)?1:0 )
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