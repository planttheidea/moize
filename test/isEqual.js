// test
import test from 'ava';
import sinon from 'sinon';
import {deepEqual, shallowEqual, sameValueZeroEqual} from 'fast-equals';

// src
import * as isEqual from 'src/isEqual';

test('if getIsEqual will return equals if passed in options', (t) => {
  const options = {
    equals: sinon.spy(),
    isDeepEqual: true,
    isReact: true
  };

  const result = isEqual.getIsEqual(options);

  t.is(result, options.equals);
});

test('if getIsEqual will return deepEqual if isDeepEqual is true', (t) => {
  const options = {
    equals: undefined,
    isDeepEqual: true,
    isReact: true
  };

  const result = isEqual.getIsEqual(options);

  t.is(result, deepEqual);
});

test('if getIsEqual will return shallowEqual if isReact is true', (t) => {
  const options = {
    equals: undefined,
    isDeepEqual: false,
    isReact: true
  };

  const result = isEqual.getIsEqual(options);

  t.is(result, shallowEqual);
});

test('if getIsEqual will return sameValueZeroEqual as an ultimate fallback', (t) => {
  const options = {
    equals: undefined,
    isDeepEqual: false,
    isReact: false
  };

  const result = isEqual.getIsEqual(options);

  t.is(result, sameValueZeroEqual);
});
