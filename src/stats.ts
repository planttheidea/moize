// utils
import { assign } from './utils';

// types
import {
  Dictionary,
  Options,
  ProfiledFunction,
  StatsCache,
  StatsObject,
  StatsProfile,
} from './types';

const INITIAL_STATS_PROFILE: StatsProfile = { calls: 0, hits: 0 };

/**
 * @private
 *
 * @var hasWarningDisplayed
 */
let hasWarningDisplayed = false;

const profileNameCounter: Dictionary<number> = {
  __anonymous__: 1,
};

/**
 * @private
 *
 * @constant statsCache the cache of statistics
 */
export const statsCache: StatsCache = {
  isCollectingStats: false,
  profiles: {},
};

/**
 * @private
 *
 * @function collectStats
 *
 * @description
 * activate stats collection
 */
export function collectStats() {
  statsCache.isCollectingStats = true;
}

export function getErrorStack() {
  const error = new Error();

  if (error.stack) {
    return error.stack;
  }

  try {
    throw error;
  } catch (e) {
    return e.stack;
  }
}

/**
 * @private
 *
 * @function getProfileName
 *
 * @description
 * get the profileName for the function when one is not provided
 *
 * @param fn the function to be memoized
 * @returns the derived profileName for the function
 */
export function getProfileName(fn: ProfiledFunction, options: Options) {
  const { profileName } = options;

  let fnName = profileName || fn.displayName || fn.name;

  if (fnName) {
    if (!profileNameCounter[fnName]) {
      profileNameCounter[fnName] = 1;
    }

    if (!profileName) {
      fnName = `${fnName} ${profileNameCounter[fnName]++}`;
    }
  } else {
    fnName = `Anonymous ${profileNameCounter.__anonymous__++}`;
  }

  if (!options.useProfileNameLocation) {
    return fnName;
  }

  const stack = getErrorStack();

  if (!stack) {
    return fnName;
  }

  const lines = stack.split('\n').slice(3);

  let profileNameLocation;

  for (let index = 0, line; index < lines.length; index++) {
    line = lines[index];

    if (!~line.indexOf('/moize/') && !~line.indexOf(' (native)') && !~line.indexOf(' Function.')) {
      profileNameLocation = line.replace(/\n/g, '\\n').trim();
      break;
    }
  }

  return profileNameLocation ? `${fnName} ${profileNameLocation}` : fnName;
}

/**
 * @private
 *
 * @function getStats
 *
 * @description
 * get the statistics for a given method or all methods
 *
 * @param [profileName] the profileName to get the statistics for (get all when not provided)
 * @returns the object with stats information
 */
export function getStats(profileName?: string): StatsObject {
  if (!statsCache.isCollectingStats && !hasWarningDisplayed) {
    // eslint-disable-next-line no-console
    console.warn(
      'Stats are not currently being collected, please run "collectStats" to enable them.',
    );

    hasWarningDisplayed = true;
  }

  if (profileName) {
    if (!statsCache.profiles[profileName]) {
      statsCache.profiles[profileName] = assign({}, INITIAL_STATS_PROFILE);
    }

    const profile = statsCache.profiles[profileName];

    return assign({}, profile, {
      usage: getUsagePercentage(profile.calls, profile.hits),
    });
  }

  const completeStats: StatsObject = assign({}, INITIAL_STATS_PROFILE, {
    profiles: {},
    usage: '',
  });

  let profile;

  // eslint-disable-next-line guard-for-in
  for (const name in statsCache.profiles) {
    profile = statsCache.profiles[name];

    /* eslint-disable no-param-reassign */
    completeStats.calls += profile.calls;
    completeStats.hits += profile.hits;
    /* eslint-enable */

    completeStats.profiles[name] = getStats(name);
  }

  completeStats.usage = getUsagePercentage(completeStats.calls, completeStats.hits);

  return completeStats;
}

export function getStatsOptions(options: Options) {
  if (statsCache.isCollectingStats) {
    const { profiles } = statsCache;
    const { profileName } = options;

    if (!profiles[profileName]) {
      profiles[profileName] = assign({}, INITIAL_STATS_PROFILE);
    }

    return {
      onCacheAdd() {
        profiles[options.profileName].calls++;
      },
      onCacheHit() {
        profiles[options.profileName].calls++;
        profiles[options.profileName].hits++;
      },
    };
  }

  return {};
}

/**
 * @private
 *
 * @function getUsagePercentage
 *
 * @description
 * get the usage percentage based on the number of hits and total calls
 *
 * @param calls the number of calls made
 * @param hits the number of cache hits when called
 * @returns the usage as a percentage string
 */
export function getUsagePercentage(calls: number, hits: number) {
  return calls ? `${((hits / calls) * 100).toFixed(4)}%` : '0%';
}

export function isCollectingStats() {
  return statsCache.isCollectingStats;
}
