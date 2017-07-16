// test
import test from 'ava';

// src
import ReactCacheKey from 'src/ReactCacheKey';

test.todo('if the instance is constructed with the correct values');

test.todo('if _isPropShallowEqual will return false if the key is not the same size as the prop on this.key');

test.todo('if _isPropShallowEqual will return false if the key is not shallowly equal to the prop on this.key');

test.todo('if _isPropShallowEqual will return true if the key is shallowly equal to the prop on this.key');

test.todo('if matches will return false if the key passed is not a multi-parameter');

test.todo('if matches will return false if the key passed is a multi-parameter key that is not shallowly equal');

test.todo('if matches will return true if the key passed is a multi-parameter key that is shallowly equal');
