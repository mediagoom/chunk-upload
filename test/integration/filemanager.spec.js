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

    });

    it('should handle append', async () => {

        const fm = new filemanager(__dirname);
        const f = './mediagoom.jpg';
        const f2 = './mediagoom2.jpg';

        if( await fm.exist(f2))
            fm.delete(f2);

        const obj_path = path.normalize(path.join(__dirname, f));
        const file = new test_file(obj_path);

        let chunk = 1024;
        let written = 0;
        const size = await file.size;

        expect( fm.root ).to.be.eq(__dirname);

        while(written < size)
        {

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

    });
});