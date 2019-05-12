const path = require('path');
const expect   = require('chai').expect;
const dbg = require('debug')('chunk-upload:integration-test-filemanager');
const filemanager = require('../../src/core/filemanager');
const CRC32    = require('../../src/core/crc').CRC32;
const test_file = require('./file');

function crc(buffer)
{
    const crc32 = new CRC32();
    crc32.update(buffer);
    const crc = crc32.finalize();

    return crc;
}

describe('FILE-MANAGER', () => {

    it('should delete un-existing file', async () => {
        
        const fm = new filemanager(process.cwd());
        await fm.delete('./mikeAndFluffy')
    });

    it('should handle exist', async () =>
    {
        const obj_path = path.normalize(path.join(process.cwd(), './'));

        dbg(obj_path);

        const fm = new filemanager(obj_path);

        fm.root = __dirname;

        let exist = await fm.exist('./mickey');
        expect(exist).to.be.false;

        exist = await fm.exist('./');
        expect(exist).to.be.true;

        exist = await fm.exist('./filemanager.spec.js');
        expect(exist).to.be.true;

        const f = './mediagoom.jpg';

        expect( await fm.exist(f) ).to.be.true;
        expect( await fm.is_file(f) ).to.be.true;
        expect( await fm.size(f)).to.be.eq(6859);

        expect( await fm.is_file(__dirname)).to.be.false;
        expect( await fm.is_file('mike')).to.be.false;

    });

    it('should handle append', async () => {

        const fm = new filemanager(__dirname);
        const f = './mediagoom.jpg';
        const f2 = './mediagoom2.jpg';

        if( await fm.exist(f2))
            await fm.delete(f2);

        const obj_path = path.normalize(path.join(__dirname, f));
        const file = new test_file(obj_path);

        let chunk = 1024;
        let written = 0;
        const size = await file.size;

        expect( fm.root ).to.be.eq(__dirname);
        let loop1 = 0;

        while(written < size)
        {
            loop1++;

            const buff = file.slice(written, written + chunk);

            const wr = await fm.write(f2, written, buff);

            written += wr;
        }

        const fm2 = new filemanager(__dirname);
        expect( await fm2.size(f2) ).to.be.eq(size);

        const buff = file.slice(chunk, chunk + chunk);
        /*const wr =*/ //await fm.write(f2, 0, buff);

        const c1 = crc(buff);

        dbg('crc', c1);

        const buff2 = await fm2.read(f2, chunk, chunk);

        const c2 = crc(buff2);

        expect(c1).to.be.eq(c2);

        written = chunk;
        await fm.truncate(f2, written);

        let loop2 = 0;

        while(written < size)
        {
            loop2++;

            const buff = file.slice(written, written + chunk);
            const wr = await fm.write(f2, written, buff);
            written += wr;
        }

        const fm3 = new filemanager(__dirname);
        expect( await fm3.size(f2) ).to.be.eq(size);

        expect(loop2 + 1).to.be.eq(loop1);

    });
    
    it('should handle close', async () => {

        const fm = new filemanager(__dirname);
        fm.close();

        const f = './mediagoom.jpg';
        const obj_path = path.normalize(path.join(__dirname, f));

        const size1 = await fm.size(f);
        const size2 = await fm.size(obj_path);
        expect(size1).to.be.eq(size2);

        await fm._open(f, 'r');
        await fm._open(f, 'r');
        await fm._open(f, 'a');
        await fm.close();

        let thrown = false;

        try{
            await fm.write(__dirname, 0, null);
        }catch(e)
        {
            dbg(e.toString());
            thrown = true;
        }

        expect(thrown).to.be.true;

        const mike = './rookie';

        if( await fm.exist(mike) )
            await fm.delete(mike);

        expect( await fm.exist(mike)).to.be.false;

        await fm.write(mike, 0, new Buffer('hello'));

        expect( await fm.exist(mike)).to.be.true;

        await fm.delete(mike);
    });

    it('should create a directory', async () => {

        const fm = new filemanager(__dirname);

        const dir = 'mike_mouse';

        let exist = await fm.is_directory(dir);

        await fm.delete(dir);

        exist = await fm.is_directory(dir);

        expect(exist).to.be.false;

        await fm.create_dir(dir);

        exist = await fm.is_directory(dir);

        expect(exist).to.be.true;

        await fm.create_dir(dir);
    });

    it('should delete a directory', async () => {

        const fm = new filemanager(__dirname);

        const dir = 'mike_mouse';

        let exist = await fm.is_directory(dir);

        if(!exist)
            fm.create_dir(dir);

        exist = await fm.is_directory(dir);

        expect(exist).to.be.true;

        await fm.delete(dir);

        exist = await fm.is_directory(dir);

        expect(exist).to.be.false;

        await fm.delete(dir);

    });
});