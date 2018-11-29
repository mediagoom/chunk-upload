const selenium = require('./selenium');
const dbg = require('debug')('chunk-upload:e2e');
const expect   = require('chai').expect;
const path = require('path');

const test_file  = process.env.TESTFILE || '../../src/test/mediagoom.jpg';
const input_path = path.resolve(path.join(__dirname, test_file));

describe('E2E', () => {

    const url = process.env['TEST_URL'] || 'http://localhost:3000';

    it('should open page',  async ( ) => {

        const xpath = '//h2[text() = "Uploader Sample"]';
        const driver = new selenium();
        try{
            
            await driver.start();
            await driver.get(url, xpath);

            await driver.by_id('__file_input');

            dbg('opening', input_path);

            await driver.keys(input_path);

            await driver.wait(10000);

        }finally{
            await driver.close();
        }

    });

});
    