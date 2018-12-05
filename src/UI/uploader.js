/* global window, document, alert */
import * as uploader from '../client.js';

const default_options = {
    url : window.location.protocol + '//' + window.location.host + '/upload'
    , owner : 'uploader'
    , upm_global : '__upm__'
    , options_function : () => alert('no options available')
    , file_input_id : '__file_input'
    , file_list_id: '__file_list__'
    , styled_file_id : '__styled_file_input__'
    , class_uploader_area : '__uploader_file_upload_area'
    , class_uploader : '__uploader_file'
    , class_host : '__uploader_host'
    , class_drag_text : '__uploader_drag_text'
    , class_uploader_folder: '__uploader_folder_select'
    , class_uploader_folder_click: '__uploader_folder_click'
    , class_uploader_folder_img: '__uploader_folder_img'
    , class_uploader_button : '__uploader_button'
    , class_uploader_file_list : '__uploader_file_list'
    , class_uploader_percentage : '__uploader_percentage'
    , class_btn : {
        options : '__uploader_btn_img_options'
        , pause : '__uploader_btn_img_pause'
        , play : '__uploader_btn_img_play'
        , quit: '__uploader_btn_img_quit'
    }
    , class : {
        notify : {
            main : '__uploader_notify'
            , error: '__uploader_notify_error'
            , success: '__uploader_notify_success'  
            , quitted: '__uploader_notify_quitted' 
        }
        , hidden : '__uploader_hidden'
    }
};

function ui_html(options)
{
    const html = `
    <div class="${options.class_host}">
        
        <ul id="${options.styled_file_id}" class="${options.class_uploader_folder}"  >
            <li class="${options.class_uploader_folder_img}">&nbsp;</li>
            <li class="${options.class_uploader_folder_click}">
                        <a  href="#" class="">
                    &nbsp; Select Files &nbsp; >> 
                </a>
            </li>
        </ul>
    
        <div class="${options.class_uploader_area}">
            <input class="${options.class_uploader}" id="${options.file_input_id}" multiple type="file" onchange='window.${options.upm_global}.selectFiles(this)' class="hidden">

            <p class="${options.class_drag_text}">or drag and drop them here.</p>
        
        </div>

        <div id="${options.file_list_id}" class="">
        </div>
    </div>
    `;

    return html;
}

function file_ui(id, options)
{
    const div = document.createElement('ul'); 

    const att = document.createAttribute('id');       
    att.value = id;                           
    div.setAttributeNode(att); 
    
    const cls = document.createAttribute('class');
    cls.value = options.class_uploader_file_list;
    div.setAttributeNode(cls);

    let file_ui_template = `    <li><span>&nbsp;</span></li>

                                <li class=""> 
                                    <a class="${options.class_uploader_button}"><span class="${options.class_btn.play}"></span> <span>start</span></a>
                                    <a class="${options.class_uploader_button}"><span class="${options.class_btn.quit}"></span> <span>quit</span></a>
                                    <a class="${options.class_uploader_button}"><span class="${options.class_btn.options}"></span> <span>options</span></a>
                                </li>

                                <li  class="${options.class_uploader_percentage}">
                                    <div class="" style="width: 0%;"></div>
                                        <span></span>
                                </li>

                                <li class="${options.class.hidden}">
                                    <div class="${options.class.notify.main}"></div>
                                </li>
                            `;

    div.innerHTML = file_ui_template;

    return div;
    
}


function update_start_ui(play, my_pause, options)
{
    if(!play)
    {
        my_pause.classList.remove(options.class_btn.pause);
        my_pause.classList.add(options.class_btn.play);
        my_pause.nextElementSibling.innerText = 'start';
    }
    else
    {
        my_pause.classList.remove(options.class_btn.play);
        my_pause.classList.add(options.class_btn.pause);
        my_pause.nextElementSibling.innerText = 'pause';
    }

    
}


function new_file(id, options)
{    
                 
    const file_list = document.getElementById(options.file_list_id);
    file_list.appendChild(file_ui(id, options));
 

    const div = document.getElementById(id);

    const info = div.children[0];
    //info.removeClass('progressview');

    const txt = info.children[0];

    const buttons = div.children[1];
    //buttons.removeClass('hidden');
   
    const progress = div.children[2];

    const notify = div.children[3];
    const notify_txt = notify.children[0];
 
    const $pause = buttons.children[0];
    const $quit  = buttons.children[1];
    const $opt   = buttons.children[2];
    

    const myself  = window[options.upm_global].uploader[id];
    const my_pause = $pause.children[0];

    $pause.addEventListener('click', function (){ 
        if (myself.paused()) 
        {
            myself.resume();
            notify.classList.add(options.class.hidden);
             
        } else { 

            myself.pause(); 
        } 

        update_start_ui(!myself.paused(), my_pause, options);
 
    });

    $opt.addEventListener('click', function () {
        options.options_function(myself);
    });

    $quit.addEventListener('click', function () {
        notify_txt.innerText = 'Upload Quitted.';    
        
        myself.pause();

        notify.classList.toggle(options.class.hidden);
        notify.previousElementSibling.classList.toggle(options.class.hidden);
        notify.previousElementSibling.previousElementSibling.classList.toggle(options.class.hidden); 
        
        
        notify.children[0].classList.add(options.class.notify.quitted); 
    });

       
    txt.innerHTML = myself.name();

    myself.on('progress', function (num) {

        var d = new Number(num);
        var x = new String(d.toFixed(0)) + '%';
        var s = new String(d.toFixed(2)) + '%';

        progress.children[0].style.width = x;
        progress.children[1].innerHTML = s;
    });

    myself.on('completed', () => {
        notify_txt.innerText = 'Upload Completed.';
        
        notify.classList.toggle(options.class.hidden);
        notify.previousElementSibling.classList.toggle(options.class.hidden);
        notify.previousElementSibling.previousElementSibling.classList.toggle(options.class.hidden); 
        
        notify.children[0].classList.remove(options.class.notify.error); 
        notify.children[0].classList.add(options.class.notify.success); 
    });

    myself.on('error', (err) => {
        
        notify_txt.innerText = 'Error: ' + err.message;
        update_start_ui(false, my_pause, options);

        notify.classList.toggle(options.class.hidden); 
        notify.children[0].classList.add(options.class.notify.error);  
    });

    
}


function onerror(err, id, options) 
{ 
    console.error(err.message, err.stack, id, JSON.stringify(options, null, 4));
}

function click_file(file_input_id)
{
    document.getElementById(file_input_id).click();
}

export function build(div_id, options)
{
    if(undefined === options)
        options = default_options;
    else
        options = Object.assign({}, options, default_options);
    
    const div = document.getElementById(div_id);

    if(!window[options.upm_global])
    {
        const upm = new uploader.UploadManager();
        window[options.upm_global] = upm;

        upm.setOptions(options);
        upm.on('new', (id) => new_file(id, options));

        div.innerHTML = ui_html(options);

        const styled_file = document.getElementById(options.styled_file_id);
        styled_file.addEventListener('click', () => click_file(options.file_input_id) );

        
        upm.on('error', (err, id) => onerror(err, id, options));
        /*
        upm.on('completed', (id) => on_completed(id, options));
        */

    }

    return window[options.upm_global];
}
