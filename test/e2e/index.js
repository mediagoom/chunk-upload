const selenium = require('./selenium');
const dbg = require('debug')('chunk-upload:e2e');
const expect   = require('chai').expect;
const path = require('path');

const test_file  = process.env.TESTFILE || '../../src/test/mediagoom.jpg';
const input_path = path.resolve(path.join(__dirname, test_file));

describe('E2E', () => {

    const url = process.env['TEST_URL'] || 'http://localhost:3000';

    it('should open page and upload',  async ( ) => {

        const xpath = '//h2[text() = "Uploader Sample"]';
        const driver = new selenium();

        const button = './ul[position() = 1]/li[position() = 2]/a[position() = 1]';
        const button2 = './ul[position() = 2]/li[position() = 2]/a[position() = 1]';
        const condition = '//ul[@class = "__uploader_file_list"]';
        const uploaded = '//div[text() = "Upload Completed."]';
        const coverage = '//div[contains(text(),"Submit Coverage")]';
        const json_coverage = '//span[text() = "coverage.json"]';

        const target_browser = process.env['TEST_BROWSER'] || undefined;
        const headless = process.env['TEST_HEADLESS'] || undefined;

        try{
            
            await driver.start(target_browser, headless);
            await driver.get(url, xpath);

            await driver.by_id('__file_input');

            dbg('opening', input_path);

            await driver.keys(input_path);

            //await driver.wait(1000);//todo wait condition

            await driver.wait_xpath(condition);

            await driver.by_id('__file_list__');

            await driver.sub_by_xpath(button);

            await driver.click();

            await driver.wait_xpath(uploaded);

            await driver.by_xpath(coverage);

            await driver.click();

            await driver.wait_xpath(json_coverage);

            await driver.by_id('__file_list__');

            await driver.sub_by_xpath(button2);

            await driver.click();

            await driver.wait(2000);

        }finally{
            await driver.close();
        }

    });

});
    