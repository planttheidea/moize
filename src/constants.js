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
 * @constant {string} FUNCTION_TYPEOF
 * @default
 */
export const FUNCTION_TYPEOF: string = 'function';

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
export const INFINITY: number = Number.POSITIVE_INFINITY;

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
export const NATIVE_PROMISE: ?Function = typeof Promise === FUNCTION_TYPEOF ? Promise : undefined;

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
  promiseLibrary: NATIVE_PROMISE,
  serialize: false,
  serializeFunctions: false,
  serializer: null,
  transformArgs: null
};

/**
 * @private
 *
 * @constant {string} OBJECT_TYPEOF
 * @default
 */
export const OBJECT_TYPEOF: string = 'object';

/**
 * @private
 *
 * @constant {Array<string>} STATIC_PROPERTIES_TO_PASS
 */
export const STATIC_PROPERTIES_TO_PASS: Array<string> = ['contextTypes', 'defaultProps', 'propTypes'];

/**
 * @private
 *
 * @constant {{isPromise: true}} PROMISE_OPTIONS
 */
export const PROMISE_OPTIONS = {
  isPromise: true
};

/**
 * @private
 *
 * @constant {{maxArgs: number, serialize: boolean, serializeFunctions: boolean}} REACT_OPTIONS
 */
export const REACT_OPTIONS = {
  isReact: true
};

/**
 * @private
 *
 * @constant {{serialize: boolean}} SERIALIZE_OPTIONS
 */
export const SERIALIZE_OPTIONS = {
  serialize: true
};
