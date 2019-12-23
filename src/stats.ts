import * as Types from './types';
import { assign } from './utils';

const INITIAL_STATS_PROFILE: Types.StatsProfile = { calls: 0, hits: 0 };

const STATS_CACHE: Types.StatsCache = {
  isCollectingStats: false,
  profiles: {},
};

const profileNameCounter: Types.Dictionary<number> = {
  __anonymous__: 1,
};

let hasWarningDisplayed = false;

/**
 * @private
 *
 * @function collectStats
 *
 * @description
 * activate stats collection
 */
export function collectStats() {
  STATS_CACHE.isCollectingStats = true;
}

/**
 * @private
 *
 * @function getErrorStack
 *
 * @description
 * get the error stack to be used for locations
 *
 * @returns the error stack
 */
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
export function getProfileName(
  fn: Types.ProfiledFunction,
  options: Types.Options,
) {
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
  let line;

  for (let index = 0; index < lines.length; index++) {
    line = lines[index];

    if (
      line.indexOf('/moize/') === -1 &&
      line.indexOf(' (native)') === -1 &&
      line.indexOf(' Function.') === -1
    ) {
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
export function getStats(profileName?: string): Types.StatsObject {
  if (!STATS_CACHE.isCollectingStats && !hasWarningDisplayed) {
    // eslint-disable-next-line no-console
    console.warn(
      'Stats are not currently being collected, please run "collectStats" to enable them.',
    );

    hasWarningDisplayed = true;
  }

  if (profileName) {
    if (!STATS_CACHE.profiles[profileName]) {
      STATS_CACHE.profiles[profileName] = assign({}, INITIAL_STATS_PROFILE);
    }

    const profile = STATS_CACHE.profiles[profileName];

    return assign({}, profile, {
      usage: getUsagePercentage(profile.calls, profile.hits),
    });
  }

  const completeStats: Types.StatsObject = assign({}, INITIAL_STATS_PROFILE, {
    profiles: {},
    usage: '',
  });

  let profile;

  // eslint-disable-next-line guard-for-in
  for (const name in STATS_CACHE.profiles) {
    profile = STATS_CACHE.profiles[name];

    /* eslint-disable no-param-reassign */
    completeStats.calls += profile.calls;
    completeStats.hits += profile.hits;
    /* eslint-enable */

    completeStats.profiles[name] = getStats(name);
  }

  completeStats.usage = getUsagePercentage(
    completeStats.calls,
    completeStats.hits,
  );

  return completeStats;
}

/**
 * @private
 *
 * @function getStatsCache
 *
 * @description
 * get the stats cache in the closure
 *
 * @returns the stats cache
 */
export function getStatsCache() {
  return STATS_CACHE;
}

/**
 * @private
 *
 * @function getStatsOptions
 *
 * @description
 * get the options specific to stats collection
 *
 * @param options the options for the memoized function
 * @returns the options related to stats
 */
export function getStatsOptions(options: Types.Options) {
  if (!STATS_CACHE.isCollectingStats) {
    return {};
  }

  const { profiles } = STATS_CACHE;
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

/**
 * @private
 *
 * @function isCollectingStats
 *
 * @description
 * are stats currently being collected
 *
 * @returns true if stats are being collected, false otherwise
 */
export function isCollectingStats() {
  return STATS_CACHE.isCollectingStats;
}
