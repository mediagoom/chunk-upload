/* global Blob, FileReader */
const superagent = require('superagent');

let check_proxy = function(){};
const rq = require;


if (typeof rq !== 'undefined' && rq) {
    
    require('superagent-proxy')(superagent);

    check_proxy = function(req)
    {
        if(null != process)
        {
            if(null != process.env)
                if(null != process.env.http_proxy)
                    req._opt.proxy = process.env.http_proxy;
        }
    };
}





function _req(opts, resolve, reject)
{
    let request = superagent;

    if(undefined != opts.request)
        request = opts.request;

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

    
    if(undefined !== opts.proxy)
    {
        r.proxy(opts.proxy);
    }
    

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

        _req(opts, resolve, reject);
   
    });
}

class httprequest {
  
    constructor(options = null)
    {
        this._opt = { };

        
        check_proxy(this);
        
            
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
    
    post(url, body){

        this._opt.method = 'POST';
        this._opt.uri    = url;

        this._opt.body   = body;

        return req(this._opt);
    }
}

module.exports = httprequest;
