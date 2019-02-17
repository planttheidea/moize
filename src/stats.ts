// eslint-disable-next-line no-unused-vars,import/no-extraneous-dependencies

// utils
import { assign } from './utils';

const INITIAL_STATS_PROFILE: Moize.StatsProfile = { calls: 0, hits: 0 };

/**
 * @private
 *
 * @var hasWarningDisplayed
 */
let hasWarningDisplayed = false;

/**
 * @private
 *
 * @constant {StatsCache} statsCache
 */
export const statsCache: Moize.StatsCache = {
  anonymousProfileNameCounter: 1,
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

export function createOnCacheAddIncrementCalls({ profileName }: Moize.Options) {
  const { profiles } = statsCache;

  if (!profiles[profileName]) {
    // eslint-disable-next-line no-multi-assign
    profiles[profileName] = assign({}, INITIAL_STATS_PROFILE);
  }

  /**
   * @private
   *
   * @function onCacheAddIncrementCalls
   *
   * @description
   * increment the number of calls for the specific profile
   *
   * @modifies {statsCache}
   */
  return function onCacheAddIncrementCalls() {
    profiles[profileName].calls++;
  };
}

export function createOnCacheHitIncrementCallsAndHits({
  profileName,
}: Moize.Options) {
  const { profiles } = statsCache;

  /**
   * @private
   *
   * @function onCacheHitIncrementCallsAndHits
   *
   * @description
   * increment the number of calls and cache hits for the specific profile
   *
   * @modifies {statsCache}
   */
  return function onCacheHitIncrementCallsAndHits() {
    profiles[profileName].calls++;
    profiles[profileName].hits++;
  };
}

interface ProfiledFunction extends Function {
  displayName?: string;
}

/**
 * @private
 *
 * @function getDefaultProfileName
 *
 * @description
 * get the profileName for the function when one is not provided
 *
 * @param fn the function to be memoized
 * @returns the derived profileName for the function
 */
export function getDefaultProfileName(fn: ProfiledFunction) {
  const { stack } = new Error();
  const fnName =
    fn.displayName ||
    fn.name ||
    `Anonymous ${statsCache.anonymousProfileNameCounter++}`;

  if (!stack) {
    return fnName;
  }

  const lines = stack.split('\n').slice(3);
  const { length } = lines;

  let profileNameLocation;

  for (let index = 0, line; index < length; index++) {
    line = lines[index];

    if (
      !~line.indexOf('/moize/') &&
      !~line.indexOf(' (native)') &&
      !~line.indexOf(' Function.')
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
 * @function getStats
 *
 * @description
 * get the statistics for a given method or all methods
 *
 * @param [profileName] the profileName to get the statistics for (get all when not provided)
 * @returns the object with stats information
 */
export function getStats(profileName?: string): Moize.StatsObject {
  if (!statsCache.isCollectingStats && !hasWarningDisplayed) {
    // eslint-disable-next-line no-console
    console.warn(
      'Stats are not currently being collected, please run "collectStats" to enable them.',
    );

    hasWarningDisplayed = true;
  }

  if (profileName) {
    if (!statsCache.profiles[profileName]) {
      statsCache.profiles[profileName] = { ...INITIAL_STATS_PROFILE };
    }

    const profile = statsCache.profiles[profileName];

    return assign({}, profile, {
      usage: getUsagePercentage(profile.calls, profile.hits),
    });
  }

  const completeStats: Moize.StatsObject = assign({}, INITIAL_STATS_PROFILE, {
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

  completeStats.usage = getUsagePercentage(
    completeStats.calls,
    completeStats.hits,
  );

  return completeStats;
}

/**
 * @private
 *
 * @function getStatsOptions
 *
 * @description
 * get the options specific to storing statistics
 *
 * @param options the options passed to the moizer
 * @returns the options specific to keeping stats
 */
export function getStatsOptions(options: Moize.Options) {
  if (statsCache.isCollectingStats) {
    return {
      onCacheAdd: createOnCacheAddIncrementCalls(options),
      onCacheHit: createOnCacheHitIncrementCallsAndHits(options),
    };
  }

  return {};
}
