const assert   = require('assert');
const dbg      = require('debug')('chunk-uploader:unit-test-uploader');


const fake_error = 'this is a unit test error';
const fake_total_size = process.env['FAKE-SIZE'] || 220;
const fake_name = 'FAKE.EXE';
const chunk_size = process.env['CHUNK-SIZE'] || 50;

class FakeRequest {
    
    constructor(throw_error)
    {
        this.size = 0;
        this.requests = 0;

        this.throw_error = (typeof throw_error === 'undefined')?false:throw_error;
    }

    put(uri, body)
    {

        if(this.throw_error)
        {
            const err = new Error(fake_error);
            
            if('promise' === this.throw_error)
            {
                return new Promise( (resolve, reject) => {reject(err);});
            }

            throw err; 
        }


        dbg('PUT', uri, body.length);

        this.size += body.length;
        this.requests++;

        return new Promise( (resolve/*, reject*/) => {resolve( {status: 200} );});
    }
}


//lastModifiedDate: Date 2019-03-15T14:33:04.979Z
//name: "CaptureFormat.exe"
//size: 11776
//type: "application/x-msdownload"

class FakeFile{

    constructor(name)
    {
        

        this.name = fake_name;
        this.lastModified = 1552660384979;
        this.size = fake_total_size;
        
        if(undefined != name)
            this.name = name;
         
    }

    slice(start, end)
    {
        dbg('slice', start, end);

        assert((end - start) <= chunk_size);
        
        return new Array(end - start);
    }
    

}

module.exports = {
    FakeRequest
    , FakeFile
    , fake_error 
    , fake_total_size 
    , fake_name
    , chunk_size  
};