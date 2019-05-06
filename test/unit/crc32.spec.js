const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-crc32');
const CRC32    = require('../../src/core/crc').CRC32;

describe('CRC32', () => {
    
    it('should compute same as crc32 command', () => {
       
        const data = {
            '0123': 0xa6669d7d
            , '4567': 0x4d0ca3eb
            , '89AB': 0x4ed18fb5
            , 'CDEF': 0xcdc75236
        };

        const keys = Object.keys(data);

        for(let i = 0; i < keys.length; i++)
        {
            const k = keys[i];

            const crc32 = new CRC32();
            crc32.update(k);
            const crc = crc32.finalize();
            expect(crc).to.be.eq(data[k]);
        }

    });
});