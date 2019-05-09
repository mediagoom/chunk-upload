const expect   = require('chai').expect;
const path = require('path');
const filemanager = require('../../src/core/filemanager');
const dbg = require('debug')('chunk-upload:integration-test-filemanager');


describe('FILE-MANAGER', () => {

    it('should handle exist', async () =>
    {
        const obj_path = path.normalize(path.join(process.cwd(), './'));

        dbg(obj_path);

        const fm = new filemanager(obj_path);

        const stat = await fm.stat(obj_path);

        expect(stat.isDirectory()).to.be.true;
        
        //dbg(stat.isDirectory(), stat);

        fm.root = __dirname;

        let exist = await fm.exist('./mickey');
        expect(exist).to.be.false;

        exist = await fm.exist('./');
        expect(exist).to.be.true;

        exist = await fm.exist('./filemanager.spec.js');
        expect(exist).to.be.true;


    });

});