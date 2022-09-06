import type { Options } from '../index.d';

/**
 * @private
 *
 * @constant DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Options = {
    isDeepEqual: false,
    isPromise: false,
    isReact: false,
    isSerialized: false,
    isShallowEqual: false,
    matchesArg: undefined,
    matchesKey: undefined,
    maxAge: undefined,
    maxArgs: undefined,
    maxSize: 1,
    onExpire: undefined,
    profileName: undefined,
    serializer: undefined,
    updateCacheForKey: undefined,
    transformArgs: undefined,
    updateExpire: false,
};
