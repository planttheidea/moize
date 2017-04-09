// types
import type{
  IteratorDone
} from './types';

/**
 * @private
 *
 * @constant {number} INFINITY
 * @default
 */
export const INFINITY = Number.POSITIVE_INFINITY;

/**
 * @private
 *
 * @constant {string} INVALID_FIRST_PARAMETER_ERROR
 * @default
 */
export const INVALID_FIRST_PARAMETER_ERROR = 'You must pass either a function or an object of options as the first parameter to moize.';

/**
 * @private
 *
 * @constant {string} NO_PROMISE_LIBRARY_EXISTS_ERROR_MESSAGE
 * @default
 */
export const NO_PROMISE_LIBRARY_EXISTS_ERROR_MESSAGE = 'You have not specified a promiseLibrary, and it appears that your browser does not support ' +
  'native promises. You can either assign the library you are using to the global Promise object, or pass ' +
  'the library in options via the "promiseLibrary" property.';

/**
 * @private
 *
 * @constant {IteratorDone} ITERATOR_DONE_OBJECT
 */
export const ITERATOR_DONE_OBJECT: IteratorDone = {
  done: true
};

/**
 * @private
 *
 * @constant {string|symbol} CACHE_IDENTIFIER
 * @default
 */
export const CACHE_IDENTIFIER = typeof Symbol === 'function' ? Symbol('isMoizeCache') : '__IS_MOIZE_CACHE__';

/**
 * @private
 *
 * @constant {function} keys
 */
export const keys: Function = Object.keys;

/**
 * @private
 *
 * @constant {function} toString
 */
export const toString: Function = Object.prototype.toString;

/**
 * @private
 *
 * @constant {function} jsonStringify
 */
export const jsonStringify: Function = JSON.stringify;

/**
 * @private
 *
 * @constant {string} ARRAY_OBJECT_CLASS
 * @default
 */
export const ARRAY_OBJECT_CLASS: string = '[object Array]';

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
 * @constant {RegExp} FUNCTION_NAME_REGEXP
 */
export const FUNCTION_NAME_REGEXP: RegExp = /^\s*function\s+([^\(\s]*)\s*/;

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
 * @constant {Array<Object>} GOTCHA_OBJECT_CLASSES
 */
export const GOTCHA_OBJECT_CLASSES: Array<Object> = [
  Boolean,
  Date,
  Number,
  RegExp,
  String
];

/**
 * @private
 *
 * @constant {Array<string>} STATIC_PROPERTIES_TO_PASS
 */
export const STATIC_PROPERTIES_TO_PASS: Array<string> = [
  'contextTypes',
  'defaultProps',
  'propTypes'
];

/**
 * @private
 *
 * @constant {number} STATIC_PROPERTIES_TO_PASS_LENGTH
 */
export const STATIC_PROPERTIES_TO_PASS_LENGTH: number = STATIC_PROPERTIES_TO_PASS.length;
