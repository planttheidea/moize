import 'core-js';
import 'regenerator-runtime/runtime';

import moize from '../src';
import { type Key, type Moized } from '../index.d';

moize.collectStats();

export function log(message: string, key: Key, value: any) {
    console.log(`result (${message})`, key, value);
}

export function logCache(memoized: Moized) {
    console.log('cache', memoized.cacheSnapshot);
}

export function logStoredValue(
    memoized: Moized,
    message: number | string,
    key: Key
) {
    console.log(`result (${message})`, key, memoized.get(key));
}

export function createContainer() {
    const div = document.createElement('div');

    div.textContent = 'Check the console for details.';

    div.id = 'app-container';
    div.style.backgroundColor = '#1d1d1d';
    div.style.boxSizing = 'border-box';
    div.style.color = '#d5d5d5';
    div.style.height = '100vh';
    div.style.padding = '15px';
    div.style.width = '100vw';

    document.body.style.margin = '0px';
    document.body.style.padding = '0px';

    document.body.appendChild(div);

    return div;
}
