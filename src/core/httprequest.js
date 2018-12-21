/* global Blob, FileReader */
const request = require('superagent');
//require('superagent-proxy')(request);

function blobToBuffer (blob, cb) {
    if (typeof Blob === 'undefined' || !(blob instanceof Blob)) {
        throw new Error('first argument must be a Blob');
    }
    if (typeof cb !== 'function') {
        throw new Error('second argument must be a function');
    }

    var reader = new FileReader();

    function onLoadEnd (e) {
        reader.removeEventListener('loadend', onLoadEnd, false);
        if (e.error) cb(e.error);
        else cb(null, new Buffer(reader.result));
    }

    reader.addEventListener('loadend', onLoadEnd, false);
    reader.readAsArrayBuffer(blob);
}


function _req(opts, resolve, reject)
{

    let r = null;

    if('GET' === opts.method)
    {
        r = request.get(opts.uri);
    }
    else if('PUT' === opts.method)
    {
        r = request.put(opts.uri);
    }
    else
    {
        r = request.post(opts.uri);
    }

    if(undefined !== opts.headers)
    {
        const keys = Object.keys(opts.headers);

        (keys).forEach(element => {
            r.set(element, opts.headers[element]);
        });
    }

    /*
    if(undefined !== opts.proxy)
    {
        r.proxy(opts.proxy);
    }
    */

    if(undefined !== opts.body)
        r.send(opts.body);

    r.end( (error, res) => {

        if(null != error){
           
            reject(error);
        }
        else{
            

            let statusCode = res.status;
                
            if(res.status >= 200 && res.status < 300)
            {
                resolve( { response: res, body : res.body} );
            }
            else
            {
                let error = new Error('Request Failed.\n' +
                                `Status Code: ${statusCode}`);

                error['body'] = res.body;
                error['statusCode'] = statusCode;
                error['headers'] = res.headers;

                reject(error);
            }
        }
    });
}



function req(opts)
{
    return new Promise( (resolve, reject) => {

        if (typeof Blob === 'undefined')
        {
            _req(opts, resolve, reject);
        }
        else
        {
            blobToBuffer(opts.body, (err, buffer) =>{
                if(null != err)
                    reject(err);
                else
                {
                    opts.body = buffer;
                    _req(opts, resolve, reject);
                }
            });
        }
   
    });
}

class httprequest {
  
    constructor(options = null)
    {
        this._opt = { };

        /*
        if(null != process)
        {
            if(null != process.env)
                if(null != process.env.http_proxy)
                    this._opt.proxy = process.env.http_proxy;
        }
        */
            
        if(null != options)
        {
            Object.assign(this._opt, options);
        }
 
    }
    
    get(url) {

        this._opt.method = 'GET';
        this._opt.uri    = url;

        return req(this._opt);
        
    }

    put(url, body){

        this._opt.method = 'PUT';
        this._opt.uri    = url;

        this._opt.body   = body;

        return req(this._opt);
    }
}

module.exports = httprequest;
