

const default_options = {
    ids : {
        modal : 'chunk-upload-modal-dialog'
    }
    , class : {
        modal : 'cud-modal'
        , close : 'cud-modal-close'
    }
};

function create_default(win)
{
    const opt = Object.assign({}, default_options);
    opt.win = win;

    return opt;
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

function get_targets(options)
{
    const doc = options.win.document;
    const modal = doc.getElementById(options.ids.modal);
    const dialog = doc.getElementById(options.dialog_id);

    return {modal, dialog};
}

function close(options)
{
    const targets = get_targets(options);

    targets.dialog.classList.add(options.class.close);
    targets.modal.classList.add(options.class.close);
}

function open(options)
{
    const targets = get_targets(options);

    targets.dialog.classList.remove(options.class.close);
    targets.modal.classList.remove(options.class.close);

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

    options.dialog_id = div.id;

    create_modal(options);

    close(options);

    return {
        close: () => {close(options);}
        , open: () => { open(options);}
    };
};