// @flow

// types
import type {Options, StatsCache, StatsObject, StatsProfile} from './types';

// utils
import {combine} from './utils';

/**
 * @private
 *
 * @constant {StatsCache} statsCache
 */
export const statsCache: StatsCache = {
  anonymousProfileNameCounter: 1,
  isCollectingStats: false,
  profiles: {}
};

/**
 * @private
 *
 * @var {boolean} hasWarningDisplayed
 */
let hasWarningDisplayed: boolean = false;

/**
 * @private
 *
 * @function collectStats
 *
 * @description
 * activate stats collection
 */
export const collectStats = (): void => {
  statsCache.isCollectingStats = true;
};

export const createOnCacheAddIncrementCalls = (options: Options) => {
  const {profileName} = options;

  // $FlowIgnore profileName is populated
  if (!statsCache.profiles[profileName]) {
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName] = {
      calls: 0,
      hits: 0
    };
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
  return () => {
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].calls++;
  };
};

export const createOnCacheHitIncrementCallsAndHits = (options: Options) => {
  const {profileName} = options;

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
  return () => {
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].calls++;
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].hits++;
  };
};

/**
 * @private
 *
 * @function getDefaultProfileName
 *
 * @description
 * get the profileName for the function when one is not provided
 *
 * @param {function} fn the function to be memoized
 * @returns {string} the derived profileName for the function
 */
export const getDefaultProfileName = (fn: Function): string => {
  const stack = new Error().stack;
  const fnName = fn.displayName || fn.name || `Anonymous ${statsCache.anonymousProfileNameCounter++}`;

  if (!stack) {
    return fnName;
  }

  const lines = stack.split('\n').slice(3);

  let line, profileNameLocation;

  for (let index = 0; index < lines.length; index++) {
    line = lines[index];

    if (!~line.indexOf('/moize/') && !~line.indexOf(' (native)') && !~line.indexOf(' Function.')) {
      profileNameLocation = line.replace(/\n/g, '\\n').trim();
      break;
    }
  }

  return profileNameLocation ? `${fnName} ${profileNameLocation}` : fnName;
};

/**
 * @private
 *
 * @function getUsagePercentage
 *
 * @description
 * get the usage percentage based on the number of hits and total calls
 *
 * @param {number} calls the number of calls made
 * @param {number} hits the number of cache hits when called
 * @returns {string} the usage as a percentage string
 */
export const getUsagePercentage = (calls: number, hits: number): string => {
  return calls ? `${(hits / calls * 100).toFixed(4)}%` : '0%';
};

/**
 * @private
 *
 * @function getStats
 *
 * @description
 * get the statistics for a given method or all methods
 *
 * @param {string} [profileName] the profileName to get the statistics for (get all when not provided)
 * @returns {StatsObject} the object with stats information
 */
export const getStats = (profileName: ?string): StatsObject => {
  if (!statsCache.isCollectingStats && !hasWarningDisplayed) {
    console.warn('Stats are not currently being collected, please run "collectStats" to enable them.'); // eslint-disable-line no-console

    hasWarningDisplayed = true;
  }

  if (profileName) {
    if (!statsCache.profiles[profileName]) {
      return {
        calls: 0,
        hits: 0,
        usage: '0%'
      };
    }

    const profile: StatsProfile = statsCache.profiles[profileName];

    return Object.assign({}, profile, {
      usage: getUsagePercentage(profile.calls, profile.hits)
    });
  }

  const completeStats: StatsProfile = Object.keys(statsCache.profiles).reduce(
    (profiles, profileName) => {
      profiles.calls += statsCache.profiles[profileName].calls;
      profiles.hits += statsCache.profiles[profileName].hits;

      return profiles;
    },
    {
      calls: 0,
      hits: 0
    }
  );

  return Object.assign({}, completeStats, {
    profiles: Object.keys(statsCache.profiles).reduce((profiles, profileName) => {
      profiles[profileName] = getStats(profileName);

      return profiles;
    }, {}),
    usage: getUsagePercentage(completeStats.calls, completeStats.hits)
  });
};

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
export const getStatsOptions = (options: Options): Object => {
  return {
    onCacheAdd: combine(options.onCacheAdd, statsCache.isCollectingStats && createOnCacheAddIncrementCalls(options)),
    onCacheHit: combine(
      options.onCacheHit,
      statsCache.isCollectingStats && createOnCacheHitIncrementCallsAndHits(options)
    )
  };
};
