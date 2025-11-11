import { getStats, moize, startCollectingStats } from '../src/index.js';

document.body.style.backgroundColor = '#1d1d1d';
document.body.style.color = '#d5d5d5';
document.body.style.margin = '0px';
document.body.style.padding = '0px';

startCollectingStats();

const div = document.createElement('div');
const span = document.createElement('span');

span.textContent = 'Check the console for details.';

div.appendChild(span);
document.body.appendChild(div);

const simple = moize((one: string, two: string) => {
    console.log('called simple');

    return { one, two };
});

console.log(simple('foo', 'bar'));
console.log(simple('foo', 'bar'));
console.log(simple('foo', 'bar'));
console.log(simple.options);

const deep = moize.deep((object: { foo: { bar: string } }) => {
    console.log('called deep');
    return { object };
});

console.log(deep({ foo: { bar: 'baz' } }));
console.log(deep({ foo: { bar: 'baz' } }));
console.log(deep({ foo: { bar: 'baz' } }));
console.log(deep.options);

const maxArgs = moize.maxArgs(1)((one: string, two: string) => {
    console.log('called maxAargs');
    return { one, two };
});

console.log(maxArgs('foo', 'bar'));
console.log(maxArgs('foo', 'baz'));
console.log(maxArgs.options);

const serialize = moize(
    (one: string, two: string) => {
        console.log('called serialize');
        return { one, two };
    },
    {
        // maxArgs: 1,
        serialize: true,
    },
);

console.log(serialize('foo', 'bar'));
console.log(serialize('foo', 'baz'));
console.log(serialize('foo', 'baz'));
console.log(serialize.cache.snapshot.keys);
console.log(serialize.options);

let index = 0;

const forceUpdate = moize.forceUpdate(([one]) => one === 'foo')((
    one: string,
    two: string,
) => {
    console.log('called force update');

    return { one, index: ++index, two };
});

forceUpdate.cache.on('update', console.log);

console.log(forceUpdate('bar', 'baz'));
console.log(forceUpdate('bar', 'baz'));
console.log(forceUpdate('foo', 'baz'));
console.log(forceUpdate('foo', 'baz'));
console.log(forceUpdate.options);

const expires = moize(
    (one: string, two: string) => {
        console.log('called expires');

        return { one, index: ++index, two };
    },
    {
        expires: {
            after: 1000,
        },
        maxSize: 2,
        statsName: 'expires',
    },
);

expires.cache.on('delete', console.log);
expires.cache.on('update', console.log);

console.log(expires('foo', 'bar'));
console.log(expires('bar', 'baz'));

const stats = moize.statsName('stats')(
    (one: string, two: string) => {
        console.log('called stats');

        return { one, index: ++index, two };
    },
    { maxSize: 2 },
);

console.log(stats('foo', 'bar'));

console.log(stats.statsManager?.m());

console.log(stats('foo', 'bar'));
console.log(stats('foo', 'bar'));
console.log(stats('foo', 'bar'));
console.log(stats('bar', 'baz'));
console.log(stats('foo', 'bar'));
console.log(stats('foo', 'bar'));

console.log(getStats('stats'));
console.log(getStats());
