const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-uploader');
const chunk    = require('../../src/client.js');
const fake     = require('./fake');





describe('MANAGER', () => {
    it('should upload files', () => {

        const http_request = new fake.FakeRequest();
    
        const opts = {
            http_request : ( ) => {return http_request;}
            , chunk_size : fake.chunk_size
        };        

        const file1 = new fake.FakeFile('file1.txt');
        const file2 = new fake.FakeFile('file2.txt');

        const manager = new chunk.UploadManager(opts);

        const e = {
            files : [file1, file2]
        };

        const ids = [];

        manager.on('new', (id) =>
        {
            ids.push(id);
        });

        manager.selectFiles(e);

        return new Promise((resolve, reject) => {
            
            manager.on('error', (err) => reject(err));

            manager.on('progress', (progress, id) => {
                
                expect(ids).to.include(id);

                if('paused' === manager.status(id))
                {
                    manager.resume(id);
                }

            });
            
            manager.on('completed', (id) => {

                expect(ids).to.include(id);
                let completed = true;
                
                ids.forEach(el => { completed = (completed && ('completed' === manager.status(el)));});

                if(completed)
                    resolve();

            });

            ids.forEach(el => { manager.start(el);}); 
            //ids.forEach(el => { manager.pause(el);});
        });   
                    
                    
    });
});