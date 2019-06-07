const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-request');
const http_request = require('../../src/core/httprequest');
const fake_request     = require('./request');

describe('HTTP REQUEST', () => {
    
    it('should support get', async () => {
        const options = {
            request : fake_request
        };


        const http = new http_request(options);
        await http.get('http://hello');
    });
    it('should support put', async () =>{
        
        const options = {
            request : fake_request
        };


        const http = new http_request(options);
        await http.put('http://hello', 'tony_and_billy');
    });
    it('should support post', async () =>{
        
        const options = {
            request : fake_request
        };


        const http = new http_request(options);
        await http.post('http://hello', 'tony_and_billy');
    });

});