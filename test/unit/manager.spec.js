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

    it('should handle duplication', () => {

        const file1 = new fake.FakeFile('file1.txt');
        const file2 = new fake.FakeFile('file1.txt');

        const manager = new chunk.UploadManager();

        const e = {
            files : [file1, file2]
        };

        let thrown = false;
        let msg = '';

        try{
            manager.selectFiles(e);
        }catch(e)
        {
            thrown = true;
            msg = e.message;
        }

        expect(thrown).to.be.true;
        expect(msg).to.match(/uploader already exist/);

        thrown = false;

        try{
            manager.pause('123');
        }catch(e)
        {
            thrown = true;
            msg = e.message;
        }

        expect(thrown).to.be.true;
        expect(msg).to.match(/invalid id/);
        try{
            manager.start('123');
        }catch(e)
        {
            thrown = true;
            msg = e.message;
        }

        expect(thrown).to.be.true;
        expect(msg).to.match(/invalid id/);


        try{
            manager.resume('123');
        }catch(e)
        {
            thrown = true;
            msg = e.message;
        }

        expect(thrown).to.be.true;
        expect(msg).to.match(/invalid id/);


        try{
            manager.status('123');
        }catch(e)
        {
            thrown = true;
            msg = e.message;
        }

        expect(thrown).to.be.true;
        expect(msg).to.match(/invalid id/);

        expect(e.files.length).to.be.eq(2);
        e.files = [e.files[0]];

        expect(e.files.length).to.be.eq(1);

        //manager.selectFiles(e);

        const status = manager.status('file1_txt');

        expect(status).to.be.eq('initialized');

        manager.pause('file1_txt');

        expect( manager.status('file1_txt') ).to.be.eq('paused');

    });


    it('should raise error', (done) => {

        const file1 = new fake.FakeFile('file1.txt');

        const manager = new chunk.UploadManager();

        const e = {
            files : [file1]
        };

        manager.selectFiles(e);

        manager.on('error', (e) => {

            //console.log(e);

            try{
                expect(e.message).to.match(/invalid start/);
                done();
            }catch(err)
            {
                done(err);
            }

        });

        manager.resume('file1_txt');
    });

});