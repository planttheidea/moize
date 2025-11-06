import { moize } from '../src/index.js';

document.body.style.backgroundColor = '#1d1d1d';
document.body.style.color = '#d5d5d5';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

const div = document.createElement('div');

div.textContent = 'Check the console for details.';

document.body.appendChild(div);

const simple = moize((one: string, two: string) => ({ one, two }));

console.log(simple('foo', 'bar'));

const maxArgs = moize((one: string, two: string) => ({ one, two }), {
    maxArgs: 1,
});

console.log(maxArgs('foo', 'bar'));
console.log(maxArgs('foo', 'baz'));

const serialize = moize((one: string, two: string) => ({ one, two }), {
    // maxArgs: 1,
    serialize: true,
});

console.log(serialize('foo', 'bar'));
console.log(serialize('foo', 'baz'));
console.log(serialize.cache.snapshot.keys);

let index = 0;

const forceUpdate = moize(
    (one: string, two: string) => ({ one, index: ++index, two }),
    { forceUpdate: ([one]) => one === 'foo' }
);

forceUpdate.cache.on('update', console.log);

console.log(forceUpdate('bar', 'baz'));
console.log(forceUpdate('bar', 'baz'));
console.log(forceUpdate('foo', 'baz'));
console.log(forceUpdate('foo', 'baz'));
