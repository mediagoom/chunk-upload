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
};

function ui_html(options)
{
    const html = `
    <div class="${options.class_host}">
        
        <div class="${options.class_uploader_folder}">
        <p class="${options.class_uploader_folder_click}">
            <a id="${options.styled_file_id}" href="#" class=""><span class=""></span> &nbsp; Select Files &nbsp; >> </a>
        </p>
        </div>
    
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

function file_ui(id/*, options*/)
{
    const div = document.createElement('div'); 

    const att = document.createAttribute('id');       
    att.value = id;                           
    div.setAttributeNode(att); 
    
    let file_ui_template = `<div class="" ><span>&nbsp;</span></div>
                                <div class=""> 
                                    <a class="btn btn-default "><span class=""></span> start</a>
                                    <a class="btn btn-default"><span class=""></span> quit</a>
                                    <a class="btn btn-default"><span class=""></span> options</a>
                                </div>

                                <div  class="">
                                    <div class="" style="width: 0%;"><span></span></div>
                                </div>
                            `;

    div.innerHTML = file_ui_template;

    return div;
    
}

function new_file(id, options)
{    
                 
    const file_list = document.getElementById(options.file_list_id);
    file_list.appendChild(file_ui(id, options));
 

    const div = document.getElementById(id);

    //const info = div.children[0];
    //info.removeClass('progressview');

    //const txt = info.children().first();

    //const buttons = div.find(':nth-child(2)').first();
    //buttons.removeClass('hidden');

    /*
        var progress = div.children(':nth-child(3)');
            progress.removeClass('hidden');

        var $pause = buttons.find(':first-child').first();
        var $quit  = buttons.find(':nth-child(2)').first();
        var $opt   = buttons.find(':nth-child(3)').first();

        var myself  = $upm.uploader[id];
        var mypause = $pause;

        $pause.click(function () { if (myself.paused()) { myself.resume(); mypause.html('<span class="glyphicon glyphicon-pause"></span> pause'); } else { myself.pause(); mypause.html('<span class="glyphicon glyphicon-play"></span> resume'); } });

        $opt.click(function () {
            alert('no options available');
        });

        $quit.click(function () {
            
            txt.text("Quitted");
            myself.pause();

            $pause.hide();
        });

       
        txt.text(myself.name());

        myself.on('progress', function (num) {

            var d = new Number(num);
            var x = new String(d.toFixed(0)) + '%';
            var s = new String(d.toFixed(2)) + '%';

            progress.find(":first-child").css('width', x);
            progress.find(":first-child :first-child").text(s);

    */
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
        window[options.upm_global]= upm;

        upm.setOptions(options);
        upm.on('new', (id) => new_file(id, options));

        div.innerHTML = ui_html(options);

        const styled_file = document.getElementById(options.styled_file_id);
        styled_file.addEventListener('click', () => document.getElementById(options.file_input_id).click() );
    }
}
