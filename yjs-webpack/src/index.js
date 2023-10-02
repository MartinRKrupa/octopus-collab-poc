import _ from 'lodash';
import { testYJS } from './yjs-test.ts';

function component() {
    const element = document.createElement('div');

    // Lodash, currently included via a script, is required for this line to work
    element.innerHTML = _.join(['Hello', 'webpack.','Check console log to see if YJS is working'], ' ');
    return element;
}

document.body.appendChild(component());
testYJS();