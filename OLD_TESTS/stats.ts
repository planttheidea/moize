/* globals afterEach,describe,expect,jest,it */

// src
import {
  collectStats,
  createOnCacheAddIncrementCalls,
  createOnCacheHitIncrementCallsAndHits,
  getDefaultProfileName,
  getStats,
  getStatsOptions,
  getUsagePercentage,
  statsCache,
} from '../src/stats';

describe('collectStats', () => {
  it('should set isCollectingStats to true', () => {
    expect(statsCache.isCollectingStats).toBe(false);

    collectStats();

    expect(statsCache.isCollectingStats).toBe(true);
  });
});

describe('getStats', () => {
  it('should warn in the console when not collecting statistics', () => {
    const { isCollectingStats } = statsCache;

    statsCache.isCollectingStats = false;

    const { warn } = console;

    // eslint-disable-next-line no-console
    console.warn = jest.fn();

    getStats();

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledTimes(1);

    // eslint-disable-next-line no-console
    console.warn = warn;

    statsCache.isCollectingStats = isCollectingStats;
  });

  it('should return all stats if no profileName is passed', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    const result = getStats();

    expect(result).toEqual({
      calls: statsCache.profiles.foo.calls + statsCache.profiles.bar.calls,
      hits: statsCache.profiles.foo.hits + statsCache.profiles.bar.hits,
      profiles: {
        bar: {
          ...statsCache.profiles.bar,
          usage: '66.6667%',
        },
        foo: {
          ...statsCache.profiles.foo,
          usage: '50.0000%',
        },
      },
      usage: '60.0000%',
    });

    Object.assign(statsCache, sc);
  });

  it('should return specific stats if a profileName is passed', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    const result = getStats('foo');

    expect(result).toEqual({
      ...statsCache.profiles.foo,
      usage: '50.0000%',
    });

    Object.assign(statsCache, sc);
  });

  it('should return empty stats if a profileName is passed but does not exist', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    const result = getStats('baz');

    expect(result).toEqual({
      calls: 0,
      hits: 0,
      usage: '0%',
    });

    Object.assign(statsCache, sc);
  });
});

describe('onCacheAddIncrementCalls', () => {
  it('should increment calls for the specific profile', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    const options = {
      profileName: 'foo',
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    createOnCacheAddIncrementCalls(options)();

    expect(statsCache.profiles).toEqual({
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 3,
        hits: 1,
      },
    });

    Object.assign(statsCache, sc);
  });

  it('should increment calls for the specific profile that did not previously exist', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    const options = {
      profileName: 'baz',
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    createOnCacheAddIncrementCalls(options)();

    expect(statsCache.profiles).toEqual({
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

    Object.assign(statsCache, sc);
  });
});

describe('onCacheAddIncrementHits', () => {
  it('should increment calls and hits for the specific profile', () => {
    const sc = {
      ...statsCache,
      profiles: { ...statsCache.profiles },
    };

    const options = {
      profileName: 'foo',
    };

    statsCache.profiles = {
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 2,
        hits: 1,
      },
    };

    createOnCacheHitIncrementCallsAndHits(options)();

    expect(statsCache.profiles).toEqual({
      bar: {
        calls: 3,
        hits: 2,
      },
      foo: {
        calls: 3,
        hits: 2,
      },
    });

    Object.assign(statsCache, sc);
  });
});

describe('getDefaultProfileName', () => {
  const currentError = global.Error;

  afterEach(() => {
    global.Error = currentError;
  });

  it('should return the function name with the location when a stack is provided', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo\nquz';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getDefaultProfileName(fn);

    expect(result).toBe(`${fn.name} quz`);
  });

  it('should return the function name by itself when no location can be found', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getDefaultProfileName(fn);

    expect(result).toBe(fn.name);
  });

  it('should return the function name by itself when no stack can be found', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getDefaultProfileName(fn);

    expect(result).toBe(fn.name);
  });

  it('should return the displayName when it exists', () => {
    const fn = function foo() {};

    fn.displayName = 'foo';

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getDefaultProfileName(fn);

    expect(result).toBe(fn.displayName);
  });

  it('should return a fallback name when a name cannot be discovered', () => {
    const fn = () => {};

    // @ts-ignore
    delete fn.name;

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getDefaultProfileName(fn);

    expect(result).toBe(
      `Anonymous ${statsCache.anonymousProfileNameCounter - 1}`,
    );
  });
});

describe('getUsagePercentage', () => {
  it('should return the correct percentage when calls is non-zero', () => {
    const calls = 4;
    const hits = 3;

    const result = getUsagePercentage(calls, hits);

    expect(result).toBe('75.0000%');
  });

  it('should return the correct percentage when calls is zero', () => {
    const calls = 0;
    const hits = 0;

    const result = getUsagePercentage(calls, hits);

    expect(result).toBe('0%');
  });
});

describe('getStatsOptions', () => {
  it('should return the statsCache methods when collecting stats', () => {
    statsCache.isCollectingStats = true;

    const options = {
      onCacheAdd() {},
      onCacheHit() {},
    };

    const result = getStatsOptions(options);

    expect(Object.keys(result)).toEqual(['onCacheAdd', 'onCacheHit']);
    expect(typeof result.onCacheAdd).toBe('function');
    expect(typeof result.onCacheHit).toBe('function');

    expect(result.onCacheAdd.toString()).toBe(
      createOnCacheAddIncrementCalls(options).toString(),
    );
    expect(result.onCacheHit.toString()).toBe(
      createOnCacheHitIncrementCallsAndHits(options).toString(),
    );
  });

  it('should return the an empty object when not collecting stats', () => {
    statsCache.isCollectingStats = false;

    const options = {
      onCacheAdd() {},
      onCacheHit() {},
    };

    const result = getStatsOptions(options);

    expect(result).toEqual({});
  });
});
