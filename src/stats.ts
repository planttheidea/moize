import type {
    GlobalStatsObject,
    Moizeable,
    OnCacheOperation,
    Options,
    StatsCache,
    StatsProfile,
} from '../index.d';

export const statsCache: StatsCache = {
    anonymousProfileNameCounter: 1,
    isCollectingStats: false,
    profiles: {},
};

let hasWarningDisplayed = false;

export function clearStats(profileName?: string) {
    if (profileName) {
        delete statsCache.profiles[profileName];
    } else {
        statsCache.profiles = {};
    }
}

/**
 * @private
 *
 * @description
 * activate stats collection
 *
 * @param isCollectingStats should stats be collected
 */
export function collectStats(isCollectingStats = true) {
    statsCache.isCollectingStats = isCollectingStats;
}

/**
 * @private
 *
 * @description
 * create a function that increments the number of calls for the specific profile
 */
export function createOnCacheAddIncrementCalls<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
) {
    const { profileName } = options;

    return function () {
        if (profileName && !statsCache.profiles[profileName]) {
            statsCache.profiles[profileName] = {
                calls: 0,
                hits: 0,
            };
        }

        statsCache.profiles[profileName].calls++;
    };
}

/**
 * @private
 *
 * @description
 * create a function that increments the number of calls and cache hits for the specific profile
 */
export function createOnCacheHitIncrementCallsAndHits<
    MoizeableFn extends Moizeable
>(options: Options<MoizeableFn>) {
    return function () {
        const { profiles } = statsCache;
        const { profileName } = options;

        if (!profiles[profileName]) {
            profiles[profileName] = {
                calls: 0,
                hits: 0,
            };
        }

        profiles[profileName].calls++;
        profiles[profileName].hits++;
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
export function getDefaultProfileName<MoizeableFn extends Moizeable>(
    fn: MoizeableFn
) {
    return (
        fn.displayName ||
        fn.name ||
        `Anonymous ${statsCache.anonymousProfileNameCounter++}`
    );
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
    return calls ? `${((hits / calls) * 100).toFixed(4)}%` : '0.0000%';
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

    const { profiles } = statsCache;

    if (profileName) {
        if (!profiles[profileName]) {
            return {
                calls: 0,
                hits: 0,
                usage: '0.0000%',
            };
        }

        const { [profileName]: profile } = profiles;

        return {
            ...profile,
            usage: getUsagePercentage(profile.calls, profile.hits),
        };
    }

    const completeStats: StatsProfile = Object.keys(statsCache.profiles).reduce(
        (completeProfiles, profileName) => {
            completeProfiles.calls += profiles[profileName].calls;
            completeProfiles.hits += profiles[profileName].hits;

            return completeProfiles;
        },
        {
            calls: 0,
            hits: 0,
        }
    );

    return {
        ...completeStats,
        profiles: Object.keys(profiles).reduce(
            (computedProfiles, profileName) => {
                computedProfiles[profileName] = getStats(profileName);

                return computedProfiles;
            },
            {} as Record<string, StatsProfile>
        ),
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
export function getStatsOptions<MoizeableFn extends Moizeable>(
    options: Options<MoizeableFn>
): {
    onCacheAdd?: OnCacheOperation<MoizeableFn>;
    onCacheHit?: OnCacheOperation<MoizeableFn>;
} {
    return statsCache.isCollectingStats
        ? {
              onCacheAdd: createOnCacheAddIncrementCalls(options),
              onCacheHit: createOnCacheHitIncrementCallsAndHits(options),
          }
        : {};
}
