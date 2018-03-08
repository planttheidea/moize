// @flow

// types
import type {Options, StatsCache, StatsObject, StatsProfile} from './types';

// utils
import {combine} from './utils';

export const statsCache: StatsCache = {
  anonymousProfileNameCounter: 1,
  isCollectingStats: false,
  profiles: {}
};

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

  return () => {
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].calls++;
  };
};

export const createOnCacheHitIncrementCallsAndHits = (options: Options) => {
  const {profileName} = options;

  return () => {
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].calls++;
    // $FlowIgnore profileName is populated
    statsCache.profiles[profileName].hits++;
  };
};

export const getAnonymousProfileName = (fn: Function): string => {
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

export const getStats = (profileName: ?string): StatsObject => {
  if (!statsCache.isCollectingStats) {
    throw new ReferenceError('Stats are not currently being collected, please run "collectStats" to enable them.');
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
      usage: profile.calls ? `${(profile.hits / profile.calls * 100).toFixed(4)}%` : '0%'
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

  const profiles = Object.keys(statsCache.profiles).reduce((profiles, profileName) => {
    profiles[profileName] = getStats(profileName);

    return profiles;
  }, {});

  return Object.assign({}, completeStats, {
    profiles,
    usage: `${(completeStats.hits / completeStats.calls * 100).toFixed(4)}%`
  });
};

export const getStatsOptions = (options: Options): Object => {
  const {onCacheAdd: onAdd, onCacheHit: onHit} = options;

  return statsCache.isCollectingStats
    ? {
      onCacheAdd: combine(onAdd, createOnCacheAddIncrementCalls(options)),
      onCacheHit: combine(onHit, createOnCacheHitIncrementCallsAndHits(options))
    }
    : {
      onCacheAdd: onAdd,
      onCacheHit: onHit
    };
};
