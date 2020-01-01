import {
  Fn,
  FunctionalComponent,
  GlobalStatsObject,
  OnCacheOperation,
  Options,
  StatsCache,
  StatsProfile,
} from './types';

export const statsCache: StatsCache = {
  anonymousProfileNameCounter: 1,
  isCollectingStats: false,
  profiles: {},
};

let hasWarningDisplayed: boolean = false;

/**
 * @private
 *
 * @description
 * activate stats collection
 */
export function collectStats() {
  statsCache.isCollectingStats = true;
}

/**
 * @private
 *
 * @description
 * create a function that increments the number of calls for the specific profile
 */
export function createOnCacheAddIncrementCalls(options: Options) {
  const { profileName } = options;

  if (profileName && !statsCache.profiles[profileName]) {
    statsCache.profiles[profileName] = {
      calls: 0,
      hits: 0,
    };
  }

  return function() {
    statsCache.profiles[profileName].calls++;
  };
}

/**
 * @private
 *
 * @description
 * create a function that increments the number of calls and cache hits for the specific profile
 */
export function createOnCacheHitIncrementCallsAndHits(options: Options) {
  const { profileName } = options;

  return function() {
    statsCache.profiles[profileName].calls++;
    statsCache.profiles[profileName].hits++;
  };
}

/**
 * @private
 *
 * @description
 * get the profileName for the function when one is not provided
 *
 * @param fn the function to be memoized
 * @returns the derived profileName for the function
 */
export function getDefaultProfileName(fn: Fn | FunctionalComponent<{}>) {
  const stack = new Error().stack;
  const fnName =
    (fn as FunctionalComponent<{}>).displayName ||
    fn.name ||
    `Anonymous ${statsCache.anonymousProfileNameCounter++}`;

  if (!stack) {
    return fnName;
  }

  const lines = stack.split('\n').slice(3);

  let line, profileNameLocation;

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
 * @description
 * get the statistics for a given method or all methods
 *
 * @param [profileName] the profileName to get the statistics for (get all when not provided)
 * @returns the object with stats information
 */
export function getStats(profileName?: string): GlobalStatsObject {
  if (!statsCache.isCollectingStats && !hasWarningDisplayed) {
    console.warn(
      'Stats are not currently being collected, please run "collectStats" to enable them.'
    ); // eslint-disable-line no-console

    hasWarningDisplayed = true;
  }

  if (profileName) {
    if (!statsCache.profiles[profileName]) {
      return {
        calls: 0,
        hits: 0,
        usage: '0%',
      };
    }

    const profile: StatsProfile = statsCache.profiles[profileName];

    return {
      ...profile,
      usage: getUsagePercentage(profile.calls, profile.hits),
    };
  }

  const completeStats: StatsProfile = Object.keys(statsCache.profiles).reduce(
    (profiles, profileName) => {
      profiles.calls += statsCache.profiles[profileName].calls;
      profiles.hits += statsCache.profiles[profileName].hits;

      return profiles;
    },
    {
      calls: 0,
      hits: 0,
    }
  );

  return {
    ...completeStats,
    profiles: Object.keys(statsCache.profiles).reduce((profiles, profileName) => {
      profiles[profileName] = getStats(profileName);

      return profiles;
    }, {}),
    usage: getUsagePercentage(completeStats.calls, completeStats.hits),
  };
}

/**
 * @private
 *
 * @function getStatsOptions
 *
 * @description
 * get the options specific to storing statistics
 *
 * @param {Options} options the options passed to the moizer
 * @returns {Object} the options specific to keeping stats
 */
export function getStatsOptions(
  options: Options
): {
  onCacheAdd?: OnCacheOperation;
  onCacheHit?: OnCacheOperation;
} {
  return statsCache.isCollectingStats
    ? {
        onCacheAdd: createOnCacheAddIncrementCalls(options),
        onCacheHit: createOnCacheHitIncrementCallsAndHits(options),
      }
    : {};
}
