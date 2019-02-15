// test
import sinon from 'sinon';

// src
import * as stats from 'src/stats';

test(
  'if getStats will warn in the console when not collecting statistics',
  done => {
    if (stats.statsCache.isCollectingStats || stats.hasWarningDisplayed) {
      done.fail();
    }

    const stub = sinon.stub(console, 'warn');

    stats.getStats();

    expect(stub.calledOnce).toBe(true);

    stub.restore();
  }
);

test('if collectStats will set isCollectingStats to true', () => {
  expect(stats.statsCache.isCollectingStats).toBe(false);

  stats.collectStats();

  expect(stats.statsCache.isCollectingStats).toBe(true);
});

test('if getStats will return all stats if no profileName is passed', () => {
  const statsCache = {
    ...stats.statsCache,
    profiles: {...stats.statsCache.profiles},
  };

  stats.statsCache.profiles = {
    bar: {
      calls: 3,
      hits: 2,
    },
    foo: {
      calls: 2,
      hits: 1,
    },
  };

  const result = stats.getStats();

  expect(result).toEqual({
    calls: stats.statsCache.profiles.foo.calls + stats.statsCache.profiles.bar.calls,
    hits: stats.statsCache.profiles.foo.hits + stats.statsCache.profiles.bar.hits,
    profiles: {
      bar: {
        ...stats.statsCache.profiles.bar,
        usage: '66.6667%',
      },
      foo: {
        ...stats.statsCache.profiles.foo,
        usage: '50.0000%',
      },
    },
    usage: '60.0000%',
  });

  Object.assign(stats.statsCache, statsCache);
});

test(
  'if getStats will return specific stats if a profileName is passed',
  () => {
    const statsCache = {
      ...stats.statsCache,
      profiles: {...stats.statsCache.profiles},
    };

    stats.statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    const result = stats.getStats('foo');

    expect(result).toEqual({
      ...stats.statsCache.profiles.foo,
      usage: '50.0000%',
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test(
  'if getStats will return empty stats if a profileName is passed but does not exist',
  () => {
    const statsCache = {
      ...stats.statsCache,
      profiles: {...stats.statsCache.profiles},
    };

    stats.statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    const result = stats.getStats('baz');

    expect(result).toEqual({
      calls: 0,
      hits: 0,
      usage: '0%',
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test(
  'if onCacheAddIncrementCalls will increment calls for the specific profile',
  () => {
    const statsCache = {
      ...stats.statsCache,
      profiles: {...stats.statsCache.profiles},
    };

    const options = {
      profileName: 'foo',
    };

    stats.statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    stats.createOnCacheAddIncrementCalls(options)();

    expect(stats.statsCache.profiles).toEqual({
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 3,
        hits: 1,
      },
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test(
  'if onCacheAddIncrementCalls will increment calls for the specific profile that did not previously exist',
  () => {
    const statsCache = {
      ...stats.statsCache,
      profiles: {...stats.statsCache.profiles},
    };

    const options = {
      profileName: 'baz',
    };

    stats.statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    stats.createOnCacheAddIncrementCalls(options)();

    expect(stats.statsCache.profiles).toEqual({
      bar: {
        calls: 3,
        hits: 2,
      },
      baz: {
        calls: 1,
        hits: 0,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test(
  'if onCacheHitIncrementCallsAndHits will increment calls and hits for the specific profile',
  () => {
    const statsCache = {
      ...stats.statsCache,
      profiles: {...stats.statsCache.profiles},
    };

    const options = {
      profileName: 'foo',
    };

    stats.statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    stats.createOnCacheHitIncrementCallsAndHits(options)();

    expect(stats.statsCache.profiles).toEqual({
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 3,
        hits: 2,
      },
    });

    Object.assign(stats.statsCache, statsCache);
  }
);

test(
  'if getDefaultProfileName will return the function name with the location when a stack is provided',
  () => {
    const fn = function foo() {};

    const currentError = global.Error;

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo\nquz';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    global.Error = FakeError;

    const result = stats.getDefaultProfileName(fn);

    expect(result).toBe(`${fn.name} quz`);

    global.Error = currentError;
  }
);

test(
  'if getDefaultProfileName will return the function name by itself when no location can be found',
  () => {
    const fn = function foo() {};

    const currentError = global.Error;

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    global.Error = FakeError;

    const result = stats.getDefaultProfileName(fn);

    expect(result).toBe(fn.name);

    global.Error = currentError;
  }
);

test(
  'if getDefaultProfileName will return the function name by itself when no stack can be found',
  () => {
    const fn = function foo() {};

    const currentError = global.Error;

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    global.Error = FakeError;

    const result = stats.getDefaultProfileName(fn);

    expect(result).toBe(fn.name);

    global.Error = currentError;
  }
);

test(
  'if getDefaultProfileName will return the displayName when it exists',
  () => {
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

    expect(result).toBe(fn.displayName);

    global.Error = currentError;
  }
);

test(
  'if getDefaultProfileName will return a fallback name when a name cannot be discovered',
  () => {
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

    expect(result).toBe(`Anonymous ${stats.statsCache.anonymousProfileNameCounter - 1}`);

    global.Error = currentError;
  }
);

test('if getUsagePercentage will return the correct percentage when calls is non-zero', () => {
  const calls = 4;
  const hits = 3;

  const result = stats.getUsagePercentage(calls, hits);

  expect(result).toBe('75.0000%');
});

test('if getUsagePercentage will return the correct percentage when calls is zero', () => {
  const calls = 0;
  const hits = 0;

  const result = stats.getUsagePercentage(calls, hits);

  expect(result).toBe('0%');
});

test(
  'if getStatsOptions will return the statsCache methods when collecting stats',
  () => {
    stats.statsCache.isCollectingStats = true;

    const options = {
      onCacheAdd() {},
      onCacheHit() {},
    };

    const result = stats.getStatsOptions(options);

    expect(Object.keys(result)).toEqual(['onCacheAdd', 'onCacheHit']);
    expect(typeof result.onCacheAdd).toBe('function');
    expect(typeof result.onCacheHit).toBe('function');

    expect(result.onCacheAdd.toString()).toBe(stats.createOnCacheAddIncrementCalls(options).toString());
    expect(result.onCacheHit.toString()).toBe(stats.createOnCacheHitIncrementCallsAndHits(options).toString());
  }
);

test(
  'if getStatsOptions will return the an empty object when not collecting stats',
  () => {
    stats.statsCache.isCollectingStats = false;

    const options = {
      onCacheAdd() {},
      onCacheHit() {},
    };

    const result = stats.getStatsOptions(options);

    expect(result).toEqual({});
  }
);
