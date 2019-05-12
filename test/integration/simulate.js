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

function get_simulator(server, uploader_root, expect)
{
    const url = uploader_root + '/the-broken-id';
    

    return {

        valid : async ( repeat ) =>
        {
            if(undefined === repeat)
                repeat = 1;

            let res = await req(server, url, 1, '0-10/30');
            dbg('valid response 1: ', url, res.status);

            let count = 0;
            while(count++ < repeat){
                res = await req(server, url, 1, '10-20/30');
                dbg('valid response 2.', count, ':', url, res.status);
            }


            res = await req(server, url, 1, '20-30/30');
            dbg('valid response 3: ', res.status);
            
            return res;
                
        }
     
        , invalid_size : async () => {
     
            let res = await req(server, url, -1, '10-20/60');
            dbg('invalid_size response 1: ', res.status, res.body.message);
            expect(res.body).to.be.not.null;
            expect(res.body.message).to.match(/Missing Content-Range/);

            res = await req(server, url, 1, '20-40/60');
            dbg('invalid_size response 2: ', res.status, res.body.message);
            expect(res.body).to.be.not.null;
            expect(res.body.message).to.match(/size did not match content length/);
            
            res = await req(server, url, 2, '40-60/60');
            dbg('invalid_size response 3: ', res.status, res.body.message);

            return res;
        }
        , broken_start : async () =>
        {
            let res = await req(server, url, 1, '10-20/30');
            dbg('broken_start response 1: ', url, res.status, res.body.message);

            res = await req(server, url, 1, '20-30/30');
            dbg('broken_start response 2: ', res.status, res.body.message);
            
            return res;
                
        }
    };
}

module.exports = get_simulator;

