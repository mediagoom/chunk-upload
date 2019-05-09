
const fs = require('fs');
const util = require('util');
const dbg    = require('debug')('chunk-upload:filemanager');
const assert = require('assert');//.strict;
const path = require('path');

const mkdir = util.promisify(fs.mkdir);
const stat = util.promisify(fs.stat);
const open = util.promisify(fs.open);
const read = util.promisify(fs.read);
const close = util.promisify(fs.close);
const write = util.promisify(fs.write);

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
    }

    async stat(obj_path)
    {
        return safe_stat(resolve_path(this.root, obj_path));
    }

    async exist(obj_path)
    {
        const stat = await this.stat(obj_path);
        const dir = stat.isDirectory();
        const file = stat.isFile();
        const res = dir || file;
        //dbg('exist', dir, file, res);
        return  res ;
    }

};