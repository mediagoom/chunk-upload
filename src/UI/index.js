/* global window, document */
import './style.scss';
import * as uploader from '../client.js';

const default_options = {
    url : window.location.protocol + '//' + window.location.host + '/upload'
    , owner : 'uploader'
    , upm_global : '__upm__'
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
    , class_hidden : '__uploader_hidden'
    , class_uploader_button : '__uploader_button'
    , class_uploader_file_list : '__uploader_file_list'
    , class_uploader_percentage : '__uploader_percentage'
    , class_btn : {
        options : '__uploader_btn_img_options'
        , pause : '__uploader_btn_img_pause'
        , play : '__uploader_btn_img_play'
        , quit: '__uploader_btn_img_quit'
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
                                    <div class="" style="width: 0%;"><span></span></div>
                                </li>
                                <li class="${options.class_hidden}">
                                </li>
                            `;

    div.innerHTML = file_ui_template;

    return div;
    
}

function toggle_button_visible(btn, hide)
{

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
 
    const $pause = buttons.children[0];
    const $quit  = buttons.children[1];
    const $opt   = buttons.children[2];

    const myself  = window[options.upm_global].uploader[id];
    const my_pause = $pause.children[0];

    $pause.addEventListener('click', function (){ 
        if (myself.paused()) 
        {
            myself.resume();
                        
             
        } else { 

            myself.pause(); 
            
        } 

        if(my_pause.classList.toggle(options.class_btn.play))
            my_pause.nextElementSibling.innerText = 'start';

        if(my_pause.classList.toggle(options.class_btn.pause))
            my_pause.nextElementSibling.innerText = 'pause';
    });

    $opt.addEventListener('click', function () {
        alert('no options available');
    });

    $quit.addEventListener('click', function () {
            
        txt.innerHTML = 'Quitted';
        myself.pause();

        toggle_button_visible($pause, false, options);
    });

       
    txt.innerHTML = myself.name();

    myself.on('progress', function (num) {

        var d = new Number(num);
        var x = new String(d.toFixed(0)) + '%';
        var s = new String(d.toFixed(2)) + '%';

        //progress.find(':first-child').css('width', x);
        progress.children[0].style.width = x;
        progress.children[0].children[0].innerHTML = s;
    });

    
}

function onerror(err, id, options) 
{ 
    //var div = jQuery("#" + id);

    //div.append('<div class="alert alert-error"><a href="#" class="close" data-dismiss="alert">&times;</a><strong>Error!</strong> Your file ' + $upm.uploader[id].name() + ' failed ' + err.message + '.</div>');

}

function on_completed(id, options) { 
    
    /*
    var div = jQuery("#" + id);

    var info = div.children().first();
    info.addClass('hidden');

    var txt = info.children().first();

    var buttons = div.find(':nth-child(2)').first();
    buttons.addClass('hidden');

    var progress = div.children(':nth-child(3)');
    progress.addClass('hidden');

    div.append('<div class="alert alert-success"><a href="#" class="close" data-dismiss="alert">&times;</a><strong>Success!</strong> Your file ' + $upm.uploader[id].name() + ' has been sent successfully.</div>');

    */

    const div = document.getElementById(id);

    const buttons = div.children[1];

    buttons.innerHTML = 'completed';

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
        upm.on('completed', (id) => on_completed(id, options));

    }
}
