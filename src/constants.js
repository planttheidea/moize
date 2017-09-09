// @flow

/**
 * @private
 *
 * @constant {RegExp} FINITE_POSITIVE_INTEGER
 */
export const FINITE_POSITIVE_INTEGER: RegExp = /^[1-9]\d*$/;

/**
 * @private
 *
 * @constant {RegExp} FUNCTION_NAME_REGEXP
 */
export const FUNCTION_NAME_REGEXP: RegExp = /^\s*function\s+([^\(\s]*)\s*/;

/**
 * @private
 *
 * @constant {Array<Object>} GOTCHA_OBJECT_CLASSES
 */
export const GOTCHA_OBJECT_CLASSES: Array<Object> = [Boolean, Date, Number, RegExp, String];

/**
 * @private
 *
 * @constant {number} INFINITY
 * @default
 */
export const INFINITY: number = 1 / 0;

/**
 * @private
 *
 * @constant {string} INVALID_FIRST_PARAMETER_ERROR
 * @default
 */
export const INVALID_FIRST_PARAMETER_ERROR: string =
  'You must pass either a function or an object of options as the first parameter to moize.';

/**
 * @private
 *
 * @constant {string} INVALID_PROMISE_LIBRARY_ERROR
 * @default
 */
export const INVALID_PROMISE_LIBRARY_ERROR: string =
  'The promiseLibrary passed must either be a function or an object with the resolve / reject methods.';

/**
 * @private
 *
 * @constant {function|undefined} NATIVE_PROMISE
 */
export const NATIVE_PROMISE: ?Function = typeof Promise === 'function' ? Promise : undefined;

/**
 * @private
 *
 * @constant {Object} DEFAULT_OPTIONS
 */
export const DEFAULT_OPTIONS: Object = {
  equals: null,
  isPromise: false,
  isReact: false,
  maxAge: INFINITY,
  maxArgs: INFINITY,
  maxSize: INFINITY,
  updateExpire: false,
  promiseLibrary: NATIVE_PROMISE,
  serialize: false,
  serializeFunctions: false,
  serializer: null,
  transformArgs: null
};

/**
 * @private
 *
 * @constant {Array<string>} STATIC_PROPERTIES_TO_PASS
 */
export const STATIC_PROPERTIES_TO_PASS: Array<string> = ['contextTypes', 'defaultProps', 'propTypes'];
