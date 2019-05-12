
const fs = require('fs');
const util = require('util');
const assert = require('assert');//.strict;
const path = require('path');
const dbg    = require('debug')('chunk-upload:filemanager');

const ulink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);
const open = util.promisify(fs.open);
const read = util.promisify(fs.read);
const close = util.promisify(fs.close);
const write = util.promisify(fs.write);
const truncate = util.promisify(fs.truncate);

async function safe_stat(path)
{
    try{

        const res = await stat(path);
        return res;

    }catch(err)
    {
        dbg('safe_stat %j', err);
        return {
            isFile : () => {return false;}
            , isDirectory : () => {return false;}
        }; 
    }
}
/*
async function directory_exist_or_create(path) {
    //const stat = await Stat(path);
    try{
        await mkdir(path, { recursive: true });
    }catch(err)
    {
        dbg('directory_exist_or_create error %j', err);
        assert(err.code === 'EEXIST');
    }
}
*/

function resolve_path(start, move)
{
    if(path.isAbsolute(move))
        return move;

    return path.normalize(path.join(start, move));
}



module.exports = class filemanager {

    constructor(root)
    {
        this.root = root;
        this.path = undefined;
        this.stat = undefined;
        this.fn = undefined;
        this.fn_path = undefined;
        this.mode = undefined;
    }

    async _stat(obj_path)
    {
        if(obj_path !== this.path)
        {
            this.stat = await safe_stat(resolve_path(this.root, obj_path));
        }

        this.path = obj_path;
    }

    async truncate(obj_path, length)
    {

        const file = resolve_path(this.root, obj_path);

        return truncate(file, length);
    }

    async _open(obj_path, mode)
    {
        assert(undefined !== this.root);
        dbg('open', resolve_path(this.root, obj_path) );
        if(obj_path !== this.fn_path || this.mode !== mode)
            this.fn = await open(resolve_path(this.root, obj_path), mode);

        this.fn_path = obj_path;
        this.mode = mode;
    }

    async close()
    {
        if(undefined !== this.fn)
            await close(this.fn);

        this.fn = undefined;
        this.fn_path = undefined;
    }

    async exist(obj_path)
    {
        
        await this._stat(obj_path);

        const dir = this.stat.isDirectory();
        const file = this.stat.isFile();
        const res = dir || file;
        //dbg('exist', dir, file, res);
        return  res ;
    }

    async is_file(obj_path)
    {
        if(! await this.exist(obj_path))
        {
            return false;
        }

        return this.stat.isFile();
    }

    async write(obj_path, position, buffer)
    {
        if(await this.exist(obj_path))
        {
            assert(await this.is_file(obj_path));
        }

        await this._open(obj_path, 'a');

        const obj = await write(this.fn, buffer, 0, buffer.length, position);

        await this.close();

        return obj.bytesWritten;
    }

    async delete(obj_path)
    {
        if(await this.exist(obj_path))
            return ulink(resolve_path(this.root, obj_path)); 
    }

    async read(obj_path, position, length)
    {
        assert(await this.is_file(obj_path));

        await this._open(obj_path, 'r');
        const buffer = new Buffer(length);
        
        const obj = await read(this.fn, buffer, 0, buffer.length, position);

        await this.close();

        //return buffer;

        return obj.buffer;
    }
    async size(obj_path)
    {
        assert(await this.is_file(obj_path));
        
        return this.stat.size;
    }
};