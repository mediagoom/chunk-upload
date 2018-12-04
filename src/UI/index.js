import './style.scss';
import {build as uploader} from './uploader';

export function build(div_id, options)
{
    return uploader(div_id, options);
}