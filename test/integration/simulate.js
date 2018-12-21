const dbg      = require('debug')('chunk-upload:integration-test-api');
const request  = require('supertest');

const buffer = new Buffer('0123456789');

async function req(server, url, chunkid, range, file, buf)
{
    let b = buffer;
    if(undefined !== buf)
        b = buf;

    if(undefined === file)
        file = 'broken.mp4';

    let content_range = 'Content-Range';
    if(chunkid < 0)
        content_range = 'invalid-header';

    return request(server)
        .put(url)
        .set('file-name', file)
        .set(content_range, 'bytes ' + range)
        .set('Content-Type', 'application/octet-stream')
        .set('chunkid', chunkid)
        .send(b);
} 

function get_simulator(server, uploader_root)
{
    const url = uploader_root + '/the-broken-id';
    
    return {
        invalid_size : async () => {
            
            let res = await req(server, url, -1, '10-20/60');
            dbg('invalid_size response 1: ', res.status, res.body);

            res = await req(server, url, 1, '20-40/60');
            dbg('invalid_size response 2: ', res.status, res.body);

            res = req(server, url, 2, '40-60/60');
            dbg('invalid_size response 3: ', res.status, res.body);

            return res;
        }
        , broken_start : async () =>
        {
            
            let res = await req(server, url, 1, '10-20/30');
            dbg('broken_start response 1: ', url, res.status, res.body);

            res = req(server, url, 1, '20-30/30');
            dbg('broken_start response 2: ', res.status, res.body);

            return res;
                
                
        }
    };
}

module.exports = get_simulator;

