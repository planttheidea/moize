// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as index from 'src/index';
import * as stats from 'src/stats';

const moize = index.default;

test('if collectStats exists as a named export', (t) => {
  t.is(index.collectStats, stats.collectStats);
});

test.todo('if moize will handle the standard use-case');

test.todo('if moize will handle a custom equals function correctly');

test.todo('if moize will handle promises correctly');

test.todo('if moize will handle React components correctly');

test.todo('if moize will handle serialization of keys correctly');

test.todo('if moize will handle expiration of items in cache correctly');

test.todo('if moize will handle limiting of arguments passed correctly');

test.todo('if moize will handle limiting of cache size correctly');

test.todo('if moize will handle an onCacheAdd method correctly');

test.todo('if moize will handle an onCacheChange method correctly');

test.todo('if moize will handle an onCacheHit method correctly');

test.todo('if moize will handle an onExpire method for cache expiration correctly');

test.todo('if moize will handle a custom profileName for stats collection correctly');

test.todo('if moize will handle function serialization when serializing correctly');

test.todo('if moize will handle a custom serializer method when serializing correctly');

test.todo('if moize will handle a custom transformArgs method correctly');

test.todo('if moize will handle an updateExpire method for cache expiration correctly');

test.todo('if moize will handle additional custom options correctly');

test.todo('if moize will handle a curried options implementation correctly');

test.todo('if moize will handle moizing a previously-moized function correctly');

test('if moize.compose calls the internal compose and returns the composed function', (t) => {
  const functions = [sinon.stub().returnsArg(0), sinon.stub().returnsArg(0)];

  const result = moize.compose(...functions);

  t.is(typeof result, 'function');

  const arg = {};

  result(arg);

  functions.forEach((fn) => {
    t.true(fn.calledOnce);
    t.true(fn.calledWith(arg));
  });
});

test('if moize.compose calls the internal compose and returns moize itself when undefined', (t) => {
  const functions = [null, false];

  const result = moize.compose(...functions);

  t.is(result, moize);
});

test.todo('moize.deep');

test('if moize.getStats is the getStats method in stats', (t) => {
  t.is(moize.getStats, stats.getStats);
});

test('if moize.isCollectingStats returns isCollectingStats in the statsCache', (t) => {
  const result = moize.isCollectingStats();

  t.is(result, stats.statsCache.isCollectingStats);
});

test.todo('moize.isMoized');

test.todo('moize.maxAge');

test.todo('moize.maxArgs');

test.todo('moize.maxSize');

test.todo('moize.promise');

test.todo('moize.react');

test.todo('moize.reactSimple');

test.todo('moize.serialize');

test.todo('moize.simple');
