const dbg      = require('debug')('chunk-upload:integration-test-api');
const request  = require('supertest');

const buffer = new Buffer('0123456789');

function get_simulator(server, uploader_root)
{
    return {
        broken_start : async () =>
        {
            const url = uploader_root + '/the-broken-id';
            let res = await request(server)
                .put(url)
                .set('file-name', 'broken.mp4')
                .set('Content-Range', 'bytes 10-20/30')
                .set('Content-Type', 'application/octet-stream')
                .set('chunkid', '1')
                .send(buffer);

            dbg('response 1: ', url, res.status, res.body);

            res = await request(server)
                .put(url)
                .set('file-name', 'broken.mp4')
                .set('Content-Range', 'bytes 20-30/30')
                .set('Content-Type', 'application/octet-stream')
                .set('chunkid', '2')
                .send(buffer);

            dbg('response 2: ', res.status, res.body);

            return res;
                
                
        }
    };
}

module.exports = get_simulator;

