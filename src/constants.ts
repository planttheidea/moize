/**
 * @private
 *
 * @constant {Object} DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Moize.Options = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  matchesKey: undefined,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: Infinity,
  onCacheAdd: undefined,
  onCacheChange: undefined,
  onCacheHit: undefined,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  shouldSerializeFunctions: false,
  transformArgs: undefined,
  updateExpire: false,
};

export const DEFAULT_OPTIONS_KEYS: {[key: string]: any} = {};

// eslint-disable-next-line guard-for-in
for (const key in DEFAULT_OPTIONS) {
  DEFAULT_OPTIONS_KEYS[key] = true;
}
