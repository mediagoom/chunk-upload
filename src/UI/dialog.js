

const default_options = {
    ids : {
        modal : 'chunk-upload-modal-dialog'
    }
    , class : {
        modal : 'cud-modal'
    }
    , open_button : undefined
};

function create_default(win)
{

    default_options.win = win;

    return default_options;
}

function create_modal(options)
{
    const modal = options.win.document.getElementById(options.ids.modal);

    if(null !== modal)
        return;

    const id = options.ids.modal;
    const class_name = options.class.modal;

    const body = options.win.document.body;

    const div = options.win.document.createElement('div'); 
    const att = options.win.document.createAttribute('id');       
    att.value = id;                           
    div.setAttributeNode(att); 
    
    const cls = options.win.document.createAttribute('class');
    cls.value = class_name;
    div.setAttributeNode(cls);

    body.appendChild(div);
}


module.exports = function(win, div_id, options)
{
    if(undefined === options)
        options = create_default(win);
    else
        options = Object.assign({}, options, create_default(win));

    let div = null;

    if(typeof div_id === 'string')
        div = win.document.getElementById(div_id);
    else
        div = div_id;

    create_modal(options);
};