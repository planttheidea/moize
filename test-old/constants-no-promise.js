// test
import test from 'ava';

const currentPromise = global.Promise;

global.Promise = undefined;

const constants = require('src/constants');

test.serial('if NATIVE_PROMISE is undefined when it does not exist in the global object', (t) => {
  t.is(constants.NATIVE_PROMISE, undefined);
});

global.Promise = currentPromise;
