/* global window */
import './style.scss';
//import {build as uploader} from './uploader';
import * as f from './uploader';

export function build(div_id, options)
{
    return f.default(window, div_id, options);
}