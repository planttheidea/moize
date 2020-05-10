import moize from '../src';

const foo = 'foo';
const bar = 'bar';

const method = jest.fn(function (one: string, two: string) {
    return { one, two };
});

describe('moize.isCollectingStats', () => {
    it('should identify if stats are being collected', () => {
        expect(moize.isCollectingStats()).toBe(false);

        moize.collectStats();

        expect(moize.isCollectingStats()).toBe(true);

        moize.collectStats(false);

        expect(moize.isCollectingStats()).toBe(false);
    });
});

describe('moize.profile', () => {
    beforeEach(() => {
        moize.collectStats();
    });

    afterEach(() => {
        moize.collectStats(false);
        moize.clearStats();
    });

    it('should create a memoized method with the profileName passed', () => {
        const profileName = 'profileName';
        const profiled = moize.profile(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 1,
            usage: '50.0000%',
        });

        profiled.clearStats();

        expect(profiled.getStats()).toEqual({
            calls: 0,
            hits: 0,
            usage: '0.0000%',
        });
    });

    it('should handle collecting more stats after clearing', () => {
        const profileName = 'profileName';
        const profiled = moize.profile(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 1,
            usage: '50.0000%',
        });

        profiled.clearStats();

        expect(profiled.getStats()).toEqual({
            calls: 0,
            hits: 0,
            usage: '0.0000%',
        });

        profiled(foo, bar);
        profiled(foo, bar);

        expect(profiled.getStats()).toEqual({
            calls: 2,
            hits: 2,
            usage: '100.0000%',
        });
    });

    it('should profile a fallback name if one is not provided', () => {
        const originalError = global.Error;

        // @ts-ignore - dummy override
        global.Error = function () {
            return {};
        };

        const memoized = moize(method);

        memoized(foo, bar);
        memoized(foo, bar);

        expect(moize.getStats()).toEqual({
            calls: 2,
            hits: 1,
            profiles: {
                [memoized.options.profileName]: {
                    calls: 2,
                    hits: 1,
                    usage: '50.0000%',
                },
            },
            usage: '50.0000%',
        });

        global.Error = originalError;
    });
});

describe('moize.getStats', () => {
    beforeEach(() => {
        moize.collectStats();
    });

    afterEach(() => {
        moize.collectStats(false);
        moize.clearStats();
    });

    it('should handle stats for all usages', () => {
        const profileName = 'profileName';
        const profiled = moize.profile(profileName)(method);

        profiled(foo, bar);
        profiled(foo, bar);

        // specific stats
        expect(moize.getStats(profileName)).toEqual({
            calls: 2,
            hits: 1,
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

    it('should warn when getting stats and stats are not being collected', () => {
        moize.collectStats(false);

        const warn = jest.spyOn(console, 'warn');

        moize.getStats();

        expect(warn).toHaveBeenCalledWith(
            'Stats are not currently being collected, please run "collectStats" to enable them.'
        );

        warn.mockRestore();
    });
});
