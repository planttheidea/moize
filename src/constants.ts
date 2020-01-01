import { Options } from './types';

/**
 * @private
 *
 * @constant DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Options = {
  equals: undefined,
  isDeepEqual: false,
  isPromise: false,
  isReact: false,
  isSerialized: false,
  matchesKey: undefined,
  maxAge: undefined,
  maxArgs: undefined,
  maxSize: 1,
  onExpire: undefined,
  profileName: undefined,
  serializer: undefined,
  shouldSerializeFunctions: false,
  transformArgs: undefined,
  updateExpire: false,
};
