import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { moize } from '../index.js';

const foo = 'foo';
const bar = 'bar';

const method = vi.fn(function (one: string, two: string) {
    return { one, two };
});

describe('isCollectingStats', () => {
    test('should identify if stats are being collected', () => {
        expect(moize.isCollectingStats()).toBe(false);

        moize.startCollectingStats();

        expect(moize.isCollectingStats()).toBe(true);

        moize.stopCollectingStats();

        expect(moize.isCollectingStats()).toBe(false);
    });
});

describe('statsName', () => {
    beforeEach(() => {
        moize.startCollectingStats();
    });

    afterEach(() => {
        moize.stopCollectingStats();
        moize.clearStats();
    });

    test('should create a memoized method with the profileName passed', () => {
        const profileName = 'profileName';
        const profiled = moize.statsName(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 1,
            name: profileName,
            usage: '50.0000%',
        });

        profiled.clearStats();

        expect(profiled.getStats()).toEqual({
            calls: 0,
            hits: 0,
            name: profileName,
            usage: '0.0000%',
        });
    });

    test('should handle collecting more stats after clearing', () => {
        const profileName = 'profileName';
        const profiled = moize.statsName(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 1,
            name: profileName,
            usage: '50.0000%',
        });

        profiled.clearStats();

        expect(profiled.getStats()).toEqual({
            calls: 0,
            hits: 0,
            name: profileName,
            usage: '0.0000%',
        });

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 2,
            name: profileName,
            usage: '100.0000%',
        });
    });
});

describe('getStats', () => {
    beforeEach(() => {
        moize.startCollectingStats();
    });

    afterEach(() => {
        moize.stopCollectingStats();
        moize.clearStats();
    });

    test('should handle stats for all usages', () => {
        const profileName = 'profileName';
        const profiled = moize.statsName(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        // specific stats
        expect(moize.getStats(profileName)).toEqual({
            calls: 2,
            hits: 1,
            name: profileName,
            usage: '50.0000%',
        });

        // global stats
        expect(moize.getStats()).toEqual({
            calls: 2,
            hits: 1,
            profiles: {
                [profileName]: {
                    calls: 2,
                    hits: 1,
                    name: profileName,
                    usage: '50.0000%',
                },
            },
            usage: '50.0000%',
        });

        moize.clearStats();

        expect(moize.getStats()).toEqual({
            calls: 0,
            hits: 0,
            profiles: {},
            usage: '0.0000%',
        });
    });

    test('should warn when getting stats and stats are not being collected', () => {
        moize.stopCollectingStats();

        const warn = vi.spyOn(console, 'warn');

        moize.getStats();

        expect(warn).toHaveBeenCalledWith(
            'Stats are not being collected; please run "moize.startCollectingStats()" to collect them.',
        );

        warn.mockRestore();
    });
});
