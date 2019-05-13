const EventEmitter = require('events');
const httprequest = require('./core/httprequest');
const CRC32 = require('./core/crc').CRC32;

function crc(buffer)
{
    const crc32 = new CRC32();
    crc32.update(buffer);
    const crc = crc32.finalize();

    return crc;
}
/**
* Utility method to format bytes into the most logical magnitude (KB, MB,
* or GB).
*/
/*function formatBytes(number) {
        var units = ['B', 'KB', 'MB', 'GB', 'TB'],
            //bytes = this,
            i;

        for (i = 0; bytes >= 1024 && i < 4; i++) {
            bytes /= 1024;
        }

        return bytes.toFixed(2) + units[i];
}*/

function storageKey(file)
{
    return `${file.name}-${file.lastModified}-${file.size}`;
}

function upload(upl)
{
    upl._started = true;

    let self = upl;

    setTimeout(function () {
        try{
            // Prevent range overflow
            if (self._range_end > self._file.size) {
                //self.range_end = self.file_size;
                throw new Error('Invalid Range On Upload!');
            }

            //console.log("re2 " + self._range_end + " " + self._range_start + " " + self._opt.chunk_size);

            let chunk = self._file[self._slice_method](self._range_start, self._range_end);
            let chunk_id = Math.ceil(self._range_start / self._opt.chunk_size);
                
            let opt   = {headers:
                {
                    'Content-Type' : 'application/octet-stream'
                    , 'Content-Range': 'bytes ' + self._range_start 
                                                + '-' + self._range_end + '/' + self._file.size
                    , 'file-name': self._opt.name
                    , 'chunkid' : chunk_id.toString()
                }
            };
            /*
            if(null != self._opt.owner){
                opt.headers['owner'] = self._opt.owner;
            }*/
            if(null != self._opt.id) {
                opt.headers['fileid'] = self._opt.id;
            } 
                            
            let http = self.http_request(opt);
            http.put(self._opt.url, chunk).then(
                (/*res*/) => {
                    //console.log("re3 " + self._range_end + " " + self._range_start + " " + self._opt.chunk_size);

                    let n = new Number((self._range_start / self._opt.chunk_size) / (self._file.size / self._opt.chunk_size) * 100);

                    let sn = n.toFixed(2);
                    

                    // If the end range is already the same size as our file, we
                    // can assume that our last chunk has been processed and exit
                    // out of the function.
                    if (self._range_end === self._file.size) {
                        if(undefined !== self._opt.storage)
                            self._opt.storage.removeItem(storageKey(self._file));
 
                        self._onUploadComplete();
                    }
                    else
                    {

                        // Update our ranges
                        self._range_start = self._range_end;
                        self._range_end = self._range_start + self._opt.chunk_size;

                        // Prevent range overflow
                        if (self._range_end > self._file.size) {
                            self._range_end = self._file.size;
                        }

                        // Continue as long as we aren't paused
                        if (!self._is_paused) {
                            upload(self);
                        }                                
                                            
                    }

                    if(undefined !== self._opt.storage)
                        self._opt.storage.setItem(storageKey(self._file), JSON.stringify( {position : self._range_start, chunk : self._opt.chunk_size} ));

                    self._onProgress(sn);
                }
                ,  (err) => {self._raise_error(err);}
            );

        }catch(err)
        {
            self._raise_error(err);
        }
            
            
    }, 20);
}

class Uploader extends EventEmitter {
    
    constructor(file, options) {
        
        super();
    
        this._file        = file;
        this._started     = false;
        this._range_end   = 0;
        this._range_start = 0;
        this._is_paused   = true;
        this._err         = null;


        

        let opt = {
            url : '/upload'
            , id : null
            , tag : null
            , name : file.name
            , owner: null
            , chunk_size : (1024 * 8) * 10
            , start_position : 0
            , storage : eval('try{localStorage}catch(e){}')

        };

        if(null != options)
            this._opt = Object.assign(opt, options);
        else
            this._opt = opt;

        if ('mozSlice' in this._file) {
            this._slice_method = 'mozSlice';
        }
        else if ('webkitSlice' in this._file) {
            this._slice_method = 'webkitSlice';
        }
        else {
            this._slice_method = 'slice';
        }
    
        this._range_start = this._opt.start_position;
        this._range_end   = this._range_start + this._opt.chunk_size;
        if(this._range_end > this._file.size)
            this._range_end = this._file.size;

        //console.log("re1 " + this._range_end + " " + this._range_start + " " + this._opt.chunk_size);
        //
        this.status       = 'initialized';

        if(undefined !== this._opt.storage)
        {
            const info = this._opt.storage.getItem(storageKey(this._file));
            this.info = null;

            if(null !== info)
            {
                try{
                    this.info = JSON.parse(info);
                }catch(e)
                {
                    console.warn('invalid storage item', e.toString());
                }
            }
            

            this.info 
            if(null !== this.info)             
            {
                
                //we have info but requested a specific range from outside
                if(0 < this._range_start || this.info.chunk != this._opt.chunk_size) 
                {
                    this.info = undefined;
                }
                else
                {
                    const data = this._file[this._slice_method](this.info.position - this.info.chunk, this.info.position);
                    const crc32 = crc(data);
                    let opt   = {headers:
                        {
                            'Content-Type' : 'application/octet-stream'
                            , 'Content-Range': 'bytes ' + this.info.position 
                                                        + '-' + (this.info.position + this.info.chunk) + '/' + this._file.size
                            , 'file-name': this._opt.name
                            
                        }
                    };
                    const http_request = this.http_request(opt);
                    this.info.validated = false;

                    http_request.get(this._opt.url).then( (j) => {
                        
                        const eventName = 'discardState';
                        
                        const crc = j.crc32;
                        //console.log('crc', crc, crc32);
                        if(crc32 === crc)
                        {
                            if(this.status === 'initialized')
                            {
                                this._range_start = this.info.position;
                                this.info.validated = true;
                                this.status = 'storageInitialized';
                                this._raise_storageInitialized(this.info.position);
                            }
                            else
                                this.emit(eventName, 'invalid status');
                        }
                        else
                            this.emit(eventName, 'invalid crc');

                    }).catch( (err) => { this._raise_error(err); this.info = undefined; } );
                }
            }

        }

    }

    http_request(request_options)
    {
        if(undefined === this._opt.http_request)
        {
            return new httprequest(request_options);
        }
        else
        {
            return this._opt.http_request(request_options);
        }
    }

    name() {return this._opt.name;}
    
    _raise_storageInitialized(position)
    {
        this.emit('storageInitialized', position);
    }
    _raise_error(err){
        //console.log("uploader error: " + err.message);
        this._is_paused = true;
        this.status = 'error';
        this._err = err;
        this.emit('error', err);
    }

    _onProgress(sn){this.emit('progress', sn);}
    _onUploadComplete(){
        this.status = 'completed';

        this.emit('completed');
    }
  
    start() {
        this._is_paused = false;
        this.emit('start');
        this.status = 'started';
        upload(this);
    }

    pause() {
        this._is_paused = true;

        this.status = 'paused';
    }

    quit()
    {
        this.pause();
        this.status = 'quitted';
    }

    paused() { return this._is_paused;}

    resume() {
        this._is_paused = false;

        this.status = 'started';
        upload(this);
    }

}


class UploadManager extends EventEmitter {
    
    constructor(options) {
 
        super();
    
        let opt = {
            url : '/upload'
            , chunk_size : (1024 * 8) * 10
            , start_position : 0
        };

        if(null != options)
            this._opt = Object.assign(opt, options);
        else
            this._opt = opt;

        this.uploader = {};
    }

    setOptions(options)
    {
        this._opt = Object.assign(this._opt, options);
    }

    _raise_error(err, kid){this.emit('error', err, kid);}
    _onProgress(sn, kid){this.emit('progress', sn, kid);}
    _onUploadComplete(kid){this.emit('completed', kid);}

    add(file, id, options)
    {
        if(undefined !== this.uploader[id])
        {
            throw new Error('uploader already exist');
        }

        let op = Object.assign(this._opt, options);
        let kid = id;
        
        let up = new Uploader(file, op);
        
        up.on('completed', () => {this._onUploadComplete(kid);});
        up.on('error', (err) => {this._raise_error(err, kid);});
        up.on('progress', (n) => { this._onProgress(n, kid);});

        this.uploader[id] = up;

        this.emit('new', id, file);

        return up;
    }

    start(id){

        if(undefined === this.uploader[id])
        {
            throw new Error('invalid id');
        }

        this.uploader[id].start();

    }

    pause(id){

        if(undefined === this.uploader[id])
        {
            throw new Error('invalid id');
        }

        this.uploader[id].pause();

    }

    resume(id){

        if(undefined === this.uploader[id])
        {
            throw new Error('invalid id');
        }

        this.uploader[id].resume();

    }

    status(id)
    {
        if(undefined === this.uploader[id])
        {
            throw new Error('invalid id');
        }

        return this.uploader[id].status;
    }

    selectFiles(e)
    {
        let files = e.files;

        for (var i = 0; i < files.length; i++) {
            let file = files[i];
                    
            let id = file.name;
            id = id.replace(/\./g, '_');
            id = id.replace(/ /g, '_');
            id = id.replace(/&/g, '_');
            //id = id.replace(/./g, '_');
                        
            this.add(file, id);
            
        }
        
    }

    get options() {return this._opt;}

}

module.exports = {
    default : Uploader
    , UploadManager
};


