const expect   = require('chai').expect;
const dbg      = require('debug')('chunk-uploader:unit-test-request');


const end =  (callback) => {

    callback(null,  {body : {id_token : 'jwt'}, status : 200});

};

const header = () => {};
const proxy = () => {};


const post =  (url) => {

    dbg(url);

    return { set :  (header) => {

        dbg(header);

        return { 
            end                
        };

    }
    , end
    , send : ()=>{}
    , proxy
    };
};


module.exports = {
    
    'get' : (url) => 
    {
        /*
        const rx1 = /\.well-known/g;

        if(rx1.test(url))
        {
            return { body: require('./wellknown.json')};
        }
        */
        return { end, header, proxy };
        
    }
    , post
    , put : post
    
};