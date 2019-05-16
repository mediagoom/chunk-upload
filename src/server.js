//import fs from 'fs';
//const fs = require('fs');
const path = require('path');
const dbg = require('debug')('chunk-upload:server');
const filemanager = require('./core/filemanager');
const CRC32    = require('./core/crc').CRC32;

function crc(buffer)
{
    const crc32 = new CRC32();
    crc32.update(buffer);
    const crc = crc32.finalize();

    return crc;
}
/**
 * Make a serializable error object.
 *
 * To create serializable errors you must re-set message so
 * that it is enumerable and you must re configure the type
 * property so that is writable and enumerable.
 *
 * @param {number} status
 * @param {string} message
 * @param {string} type
 * @param {object} props
 * @private
 */
function createError (status, message, type, props) {
    var error = new Error();

    // capture stack trace
    Error.captureStackTrace(error, createError);

    // set free-form properties
    for (var prop in props) {
        error[prop] = props[prop];
    }

    // set message
    error.message = message;

    // set status
    error.status = status;
    error.statusCode = status;

    // set type
    Object.defineProperty(error, 'type', {
        value: type
        ,enumerable: true
        ,writable: true
        ,configurable: true
    });

    return error;
}

async function get(fm, filepath, start, length)
{
    const buff = await fm.read(filepath, start, length);

    return crc(buff);
}

async function all_data(fm, filepath, start, buffer)
{
    if(await fm.is_file(filepath))
    {
        if(0 == start)
        {
            dbg('delete ', filepath);
            await fm.delete(filepath);
        }
        else
        {
            const size = await fm.size(filepath);

            if(start < size)
            {
                await fm.truncate(filepath, start);
            }

            if(start > size ) 
            {
                const err = createError(400, 'request start size is inconsistent file file size', 'request.size.invalid', {
                    expected: fm.size(filepath)
                    , received: start
                });

                throw err;
            }
        }
    } 

    dbg('write', filepath, start, buffer.length);

    await fm.write(filepath, start, buffer);
            
}

function uplaoder(options){
        
    let opt = {
        base_path : './'
        , limit : (10 * 1024 * 1024)
    };

    if(null != options)
        opt = Object.assign(opt, options);

              
    return (req, res, next) =>
    {
        const method  = req.method;
        const stream  = req;
        let complete  = false;

        let received  = 0;
        let buffer    = null;

        let limit     = opt.limit; //10MB
        let length    = 0; 

        const fm = new filemanager(opt.base_path);
        
        let filepath =  req.headers['file-name'];        

        if(undefined === filepath)
        {
            done(createError(400
                , 'request has invalid headers. Missing file-name.'
                , 'request.size.invalid'
                , {             
                }));
                
            return;
        }

        if('POST' === method)
        {
            const cl = req.headers['content-length'];

            if(undefined === cl)
            {
                done(createError(400
                    , 'request has invalid headers. Missing Content-Length.'
                    , 'request.size.invalid'
                    , {             
                    }));
                    
                return;
            }

            req.headers['content-range'] = `bytes 0-${cl}/${cl}`;

            filepath = `${filepath}.json`;
        }

        const cr = req.headers['content-range'];

        if(undefined === cr)
        {
            done(createError(400
                , 'request has invalid headers. Missing Content-Range.'
                , 'request.size.invalid'
                , {             
                }));
                
            return;
        }

        let regexp = /bytes (\d+)-(\d+)\/(\d+)/gi;
        cr.match(regexp);

        const start = parseInt(RegExp.$1);
        const end   = parseInt(RegExp.$2);
        const total = parseInt(RegExp.$3);
        const size  = end - start;

        if('GET' === method)
        {
            get(fm, filepath, start, size).then( (crc32) => {
                res.send({crc32});
                next();
            }).catch( (err) => next(err));

            return;
        }

        buffer = Buffer.alloc(size);
       
        // attach listeners
        stream.on('aborted', onAborted);
        stream.on('close', cleanup);
        stream.on('data', onData);
        stream.on('end', onEnd);
        stream.on('error', onEnd);
        //If you pass anything to the done() function (except the string 'route'), Express regards the current request as being in error and will skip any remaining non-error handling routing and middleware functions.

        function nodone(err)
        {
            if(err == null)
                res.end();
            else
                done(err);
        }

        function done(err)
        {
            cleanup();
            complete = true;

            if(err != null)
            {
                next(err);
            }
            else
            {
                next();
            }

        }
          
        function onAborted () {

            if (complete) return;

            done(createError(400, 'request aborted', 'request.aborted', {
                code: 'ECONNABORTED'
                ,expected: length
                ,length: length
                ,received: received
            }));
        }

        function onData (chunk) {
            
            if (complete) return;           

            chunk.copy(buffer, received);
            received += chunk.length;

            if (limit !== null && received > limit) {
                done(createError(413, 'request entity too large', 'entity.too.large', {
                    limit: limit
                    ,received: received
                }));
            }
        }

        function onEnd (err) {
            if (complete) return;
            if (err) return done(err);

            //if(false){
            if (size !== undefined && received !== size) {

                done(createError(400, 'request size did not match content length', 'request.size.invalid.', {
                    expected: size
                    , length: length
                    , received: received
                }));

                return;

            }
            //let path = opt.base_path;
                
            /*
                if(null != req.headers.owner)
                {
                    path += req.headers.owner;
                    path += '/';
                }
                */


                      
            req['uploader'] = path.normalize(path.join(options.base_path, filepath)); 

            let fend = nodone;

            if(end == total && 'PUT' === method)
            {
                fend = done;
            }

            all_data(fm, filepath, start, buffer).then(fend).catch(fend);
                
        }      
           
        

        function cleanup () {
            // buffer = null

            stream.removeListener('aborted', onAborted);
            stream.removeListener('data', onData);
            stream.removeListener('end', onEnd);
            stream.removeListener('error', onEnd);
            stream.removeListener('close', cleanup);
        }
        
    };
}

module.exports = uplaoder;

