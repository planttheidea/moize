// test
import test from 'ava';
import sinon from 'sinon';

// src
import * as stats from 'src/stats';
import * as utils from 'src/utils';

test.serial('if getStats will warn in the console when not collecting statistics', (t) => {
  if (stats.statsCache.isCollectingStats || stats.hasWarningDisplayed) {
    t.fail();
  }

  const stub = sinon.stub(console, 'warn');

  stats.getStats();

  t.true(stub.calledOnce);

  stub.restore();
});

test.serial('if collectStats will set isCollectingStats to true', (t) => {
  t.false(stats.statsCache.isCollectingStats);

  stats.collectStats();

  t.true(stats.statsCache.isCollectingStats);
});

test.serial('if getStats will return all stats if no profileName is passed', (t) => {
  const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

  stats.statsCache.profiles = {
    foo: {
      calls: 2,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  };

  const result = stats.getStats();

  t.deepEqual(result, {
    calls: stats.statsCache.profiles.foo.calls + stats.statsCache.profiles.bar.calls,
    hits: stats.statsCache.profiles.foo.hits + stats.statsCache.profiles.bar.hits,
    profiles: {
      foo: {
        ...stats.statsCache.profiles.foo,
        usage: '50.0000%'
      },
      bar: {
        ...stats.statsCache.profiles.bar,
        usage: '66.6667%'
      }
    },
    usage: '60.0000%'
  });

  Object.assign(stats.statsCache, statsCache);
});

test.serial('if getStats will return specific stats if a profileName is passed', (t) => {
  const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

  stats.statsCache.profiles = {
    foo: {
      calls: 2,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  };

  const result = stats.getStats('foo');

  t.deepEqual(result, {
    ...stats.statsCache.profiles.foo,
    usage: '50.0000%'
  });

  Object.assign(stats.statsCache, statsCache);
});

test.serial('if getStats will return empty stats if a profileName is passed but does not exist', (t) => {
  const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

  stats.statsCache.profiles = {
    foo: {
      calls: 2,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  };

  const result = stats.getStats('baz');

  t.deepEqual(result, {
    calls: 0,
    hits: 0,
    usage: '0%'
  });

  Object.assign(stats.statsCache, statsCache);
});

test.serial('if onCacheAddIncrementCalls will increment calls for the specific profile', (t) => {
  const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

  const options = {
    profileName: 'foo'
  };

  stats.statsCache.profiles = {
    foo: {
      calls: 2,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  };

  stats.createOnCacheAddIncrementCalls(options)();

  t.deepEqual(stats.statsCache.profiles, {
    foo: {
      calls: 3,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  });

  Object.assign(stats.statsCache, statsCache);
});

test.serial(
  'if onCacheAddIncrementCalls will increment calls for the specific profile that did not previously exist',
  (t) => {
    const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

    const options = {
      profileName: 'baz'
    };

    stats.statsCache.profiles = {
      foo: {
        calls: 2,
        hits: 1
      },
      bar: {
        calls: 3,
        hits: 2
      }
    };

    stats.createOnCacheAddIncrementCalls(options)();

    t.deepEqual(stats.statsCache.profiles, {
      foo: {
        calls: 2,
        hits: 1
      },
      bar: {
        calls: 3,
        hits: 2
      },
      baz: {
        calls: 1,
        hits: 0
      }
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test.serial('if onCacheHitIncrementCallsAndHits will increment calls and hits for the specific profile', (t) => {
  const statsCache = {...stats.statsCache, profiles: {...stats.statsCache.profiles}};

  const options = {
    profileName: 'foo'
  };

  stats.statsCache.profiles = {
    foo: {
      calls: 2,
      hits: 1
    },
    bar: {
      calls: 3,
      hits: 2
    }
  };

  stats.createOnCacheHitIncrementCallsAndHits(options)();

  t.deepEqual(stats.statsCache.profiles, {
    foo: {
      calls: 3,
      hits: 2
    },
    bar: {
      calls: 3,
      hits: 2
    }
  });

  Object.assign(stats.statsCache, statsCache);
});

test.serial(
  'if getDefaultProfileName will return the function name with the location when a stack is provided',
  (t) => {
    const fn = function foo() {};

    const currentError = global.Error;

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo\nquz';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    global.Error = FakeError;

    const result = stats.getDefaultProfileName(fn);

    t.is(result, `${fn.name} quz`);

    global.Error = currentError;
  }
);

test.serial('if getDefaultProfileName will return the function name by itself when no location can be found', (t) => {
  const fn = function foo() {};

  const currentError = global.Error;

  function FakeError() {
    this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo';

    return this;
  }

  FakeError.captureStackTrace = () => {};

  global.Error = FakeError;

  const result = stats.getDefaultProfileName(fn);

  t.is(result, fn.name);

  global.Error = currentError;
});

test.serial('if getDefaultProfileName will return the function name by itself when no stack can be found', (t) => {
  const fn = function foo() {};

  const currentError = global.Error;

  function FakeError() {
    this.stack = null;

    return this;
  }

  FakeError.captureStackTrace = () => {};

  global.Error = FakeError;

  const result = stats.getDefaultProfileName(fn);

  t.is(result, fn.name);

  global.Error = currentError;
});

test.serial('if getDefaultProfileName will return the displayName when it exists', (t) => {
  const fn = function foo() {};

  fn.displayName = 'foo';

  const currentError = global.Error;

  function FakeError() {
    this.stack = null;

    return this;
  }

  FakeError.captureStackTrace = () => {};

  global.Error = FakeError;

  const result = stats.getDefaultProfileName(fn);

  t.is(result, fn.displayName);

  global.Error = currentError;
});

test.serial('if getDefaultProfileName will return a fallback name when a name cannot be discovered', (t) => {
  const fn = () => {};

  delete fn.name;

  const currentError = global.Error;

  function FakeError() {
    this.stack = null;

    return this;
  }

  FakeError.captureStackTrace = () => {};

  global.Error = FakeError;

  const result = stats.getDefaultProfileName(fn);

  t.is(result, `Anonymous ${stats.statsCache.anonymousProfileNameCounter - 1}`);

  global.Error = currentError;
});

test('if getUsagePercentage will return the correct percentage when calls is non-zero', (t) => {
  const calls = 4;
  const hits = 3;

  const result = stats.getUsagePercentage(calls, hits);

  t.is(result, '75.0000%');
});

test('if getUsagePercentage will return the correct percentage when calls is zero', (t) => {
  const calls = 0;
  const hits = 0;

  const result = stats.getUsagePercentage(calls, hits);

  t.is(result, '0%');
});

test('if getStatsOptions will combine the options methods and the statsCache methods', (t) => {
  stats.statsCache.isCollectingStats = true;

  const options = {
    onCacheAdd() {},
    onCacheHit() {}
  };

  const combineStub = sinon.stub(utils, 'combine').returnsArg(0);

  const result = stats.getStatsOptions(options);

  t.true(combineStub.calledTwice);

  t.is(combineStub.args[0][0], options.onCacheAdd);
  t.is(combineStub.args[0][1].toString(), stats.createOnCacheAddIncrementCalls(options).toString());

  t.is(combineStub.args[1][0], options.onCacheHit);
  t.is(combineStub.args[1][1].toString(), stats.createOnCacheHitIncrementCallsAndHits(options).toString());

  t.deepEqual(result, options);
});
