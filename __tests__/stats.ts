/* eslint-disable */

// src
import {
  collectStats,
  getErrorStack,
  getProfileName,
  getStats,
  getStatsCache,
  getStatsOptions,
  getUsagePercentage,
  isCollectingStats,
} from '../src/stats';

const statsCache = getStatsCache();

describe('collectStats', () => {
  it('should set isCollectingStats to true', () => {
    expect(statsCache.isCollectingStats).toBe(false);

    collectStats();

    expect(statsCache.isCollectingStats).toBe(true);
  });
});

describe('getErrorStack', () => {
  it('should return the error stack', () => {
    const result = getErrorStack();

    expect(typeof result).toBe('string');

    const stack = result.split('\n').map((layer: string) => layer.trim());

    // first three layers of stack, which are removed
    expect(stack[0]).toEqual('Error:');
    expect(stack[1].startsWith('at Object.getErrorStack')).toBe(true);
    expect(stack[2].includes('__tests__/stats.ts')).toBe(true);

    // layer of callsite
    expect(stack[3].startsWith('at Object.asyncJestTest')).toBe(true);
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

describe('getProfileName', () => {
  const currentError = global.Error;

  afterEach(() => {
    global.Error = currentError;
  });

  it('should return the profileName when provided', () => {
    const fn = function foo() {};

    const profileName = 'profileName';

    const result = getProfileName(fn, { profileName });

    expect(result).toBe(profileName);
  });

  it('should return the function name + count when no stack is requested', () => {
    const fn = function foo() {};

    const result = getProfileName(fn, {});

    expect(result).toBe(`${fn.name} 1`);
  });

  it('should return the function name + count with the location when a stack is requested', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo\nquz';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getProfileName(fn, { useProfileNameLocation: true });

    expect(result).toBe(`${fn.name} 2 quz`);
  });

  it('should return the function name + count by itself when no location can be found', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = 'foo\nbar\nbaz\n/moize/\n (native)\n Function.foo';

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getProfileName(fn, {});

    expect(result).toBe(`${fn.name} 3`);
  });

  it('should return the function name + count by itself when no stack can be found', () => {
    const fn = function foo() {};

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getProfileName(fn, {});

    expect(result).toBe(`${fn.name} 4`);
  });

  it('should return the displayName when it exists', () => {
    const fn = function foo() {};

    fn.displayName = 'TotallyNotFoo';

    function FakeError() {
      this.stack = null;

      return this;
    }

    FakeError.captureStackTrace = () => {};

    // @ts-ignore
    global.Error = FakeError;

    const result = getProfileName(fn, {});

    expect(result).toBe(`${fn.displayName} 1`);
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

    const result = getProfileName(fn, {});

    expect(result).toBe('Anonymous 1');
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

    const options = { profileName: `profileName_${Math.random() * 100}` };

    const result = getStatsOptions(options);

    expect(typeof result.onCacheAdd).toBe('function');
    expect(typeof result.onCacheHit).toBe('function');

    const { profileName } = options;

    expect(statsCache.profiles.hasOwnProperty(profileName)).toBe(true);

    expect(statsCache.profiles[profileName].calls).toBe(0);
    expect(statsCache.profiles[profileName].hits).toBe(0);

    result.onCacheAdd();

    expect(statsCache.profiles[profileName].calls).toBe(1);

    result.onCacheHit();

    expect(statsCache.profiles[profileName].calls).toBe(2);
    expect(statsCache.profiles[profileName].hits).toBe(1);
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

describe('isCollectingStats', () => {
  it('should return whatever the value in cache is', () => {
    const result = isCollectingStats();

    expect(result).toEqual(statsCache.isCollectingStats);
  });
});
