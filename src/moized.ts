/* globals define */

import memoize, { MicroMemoize } from 'micro-memoize';
import { enhanceCache } from './cache';
import { clearExpiration } from './maxAge';
import { getStats } from './stats';
import * as Types from './types';
import { assign, getGlobalObject } from './utils';

/* eslint-disable react/forbid-foreign-prop-types */

const GLOBAL = getGlobalObject();

const REACT_OPTIONS = { isReact: true, isReactGlobal: true };

const EMPTY_OBJECT = {};

const ReactNoopUpdater = {
  enqueueForceUpdate() {},
  enqueueReplaceState() {},
  enqueueSetState() {},
  isMounted() {
    return false;
  },
};

export const STATIC_VALUES = ['cache'];
export const STATIC_METHODS = [
  'clear',
  'delete',
  'get',
  'getStats',
  'has',
  'keys',
  'set',
  'values',
];

/**
 * @private
 *
 * @function defineStaticProperty
 *
 * @description
 * define a static property on the function passed
 *
 * @param fn the function to define the property on
 * @param propertyName the name of the property to define
 * @param isMethod is the property a method
 */
function defineStaticProperty<Fn extends Types.Moizeable>(
  fn: Types.Moized<Fn>,
  propertyName: keyof Types.Moized<Fn>,
) {
  Object.defineProperty(fn, propertyName, {
    get() {
      throw new Error(`${propertyName} is not available on MoizedComponent directly. You can access it on the instance by capturing the ref and accessing the "Moized" property on it.`);
    },
  });
}

let React: { createElement: Function } = GLOBAL && 'React' in GLOBAL && GLOBAL.React;

/**
 * @private
 *
 * @function loadReact
 *
 * @description
 * `react` is a special dependency; unlike the others in this project, we should not
 * import it unless we actually need it.
 *
 * If `React` is not available globally, then attempt the various loading mechanisms:
 *
 * - Synchronous `require` (CommonJS)
 * - Asynchronous `define` (AMD)
 * - Asynchronous `import` (ESM)
 *
 * This mimics the rollup logic, including order of operations, with the addition of the
 * dynamic `import()` syntax in case this is being run in a browser `<script type="module">`.
 *
 * Throw an error if not able to successfully use any technique.
 */
function loadReact() {
  function onLoad(pkg: any) {
    React = pkg;
  }

  function onFail() {
    throw new Error(
      'You have tried to use the `isReact` option when React is not installed. Please install install `react` as a dependency of your project.',
    );
  }

  try {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      onLoad(require('react'));
      // @ts-ignore
    } else if (typeof define === 'function' && define.amd) {
      // @ts-ignore
      define(['react'], onLoad);
    } else {
      import('react')
        .catch(onFail)
        .then(onLoad);
    }
  } catch {
    onFail();
  }
}

export function createMoizedComponent<Fn extends Types.Moizeable>(
  moize: Types.Moizer<Fn>,
  fn: Fn,
  options?: Types.Options,
) {
  const componentOptions = options ? assign({}, options, REACT_OPTIONS) : REACT_OPTIONS;

  type ComponentClass = import('react').ComponentClass<GenericProps, any>;
  type FunctionComponent = import('react').FunctionComponent;
  type GenericProps = import('react').Props<any>;
  type Component<Props, State> = import('react').Component<Props, State>;

  type MoizedComponent = ComponentClass & Types.Moized<Fn>;

  if (!React) {
    loadReact();
  }

  /**
   * @NOTE This is basically creating a custom React.Component class
   *
   * Not only is this faster, it is also less code for the compiler to produce.
   */

  /* eslint-disable react/no-this-in-sfc */

  type MoizedThis = {
    Moized: FunctionComponent;
    context: Types.Dictionary<any>;
    props: GenericProps;
    refs: typeof EMPTY_OBJECT;
    updater: typeof ReactNoopUpdater;
  }

  const MoizedComponent = function MoizedComponent<Props, State>(
    this: MoizedThis,
    props: Props,
    context: Types.Dictionary<any>,
    updater: any,
  ) {
    this.props = props;
    this.context = context;
    this.refs = EMPTY_OBJECT;
    this.updater = updater || ReactNoopUpdater;

    this.Moized = moize(fn, componentOptions) as FunctionComponent;

    return this as unknown as Component<Props, State>;
  } as MoizedComponent;

  MoizedComponent.prototype.isReactComponent = EMPTY_OBJECT;

  MoizedComponent.prototype.render = function (this: MoizedThis) {
    return React.createElement(this.Moized, this.props);
  };

  // @ts-ignore
  MoizedComponent.options = options;
  MoizedComponent.fn = fn;

  Object.keys(fn).forEach((staticKey) => {
    // @ts-ignore
    MoizedComponent[staticKey] = fn[staticKey];
  });

  MoizedComponent.displayName = getDisplayName(fn);

  STATIC_METHODS.forEach((method) => defineStaticProperty(MoizedComponent, method));

  STATIC_VALUES.forEach((value) => defineStaticProperty(MoizedComponent, value));

  /* eslint-enable */

  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  return MoizedComponent;
}

export function createMoized<Fn extends Types.Moizeable>(
  moize: Types.Moizer<Fn>,
  fn: Fn,
  options: Types.Options,
) {
  if (options.isReact && !options.isReactGlobal) {
    return createMoizedComponent(moize, fn, options);
  }

  const { _mm: microMemoizeOptions } = options;

  const moized = memoize(fn, microMemoizeOptions) as Types.Moized<Fn>;

  // @ts-ignore - allow options to be assigned to the moized function
  moized.options = options;

  Object.keys(fn).forEach((staticKey) => {
    // @ts-ignore - allow statics to be passed through to the moized function
    moized[staticKey] = fn[staticKey];
  });

  if (options.isReact) {
    moized.displayName = getDisplayName(fn);
  }

  const { cache } = moized;

  moized.clear = function () {
    cache.keys.length = 0;
    cache.values.length = 0;

    if (cache.shouldUpdateOnChange) {
      microMemoizeOptions.onCacheChange(cache, options, moized);
    }

    return true;
  };

  moized.delete = function (key: MicroMemoize.Key) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    const keyIndex = cache.getKeyIndex(key);

    if (keyIndex !== -1) {
      const existingKey = cache.keys[keyIndex];

      cache.keys.splice(keyIndex, 1);
      cache.values.splice(keyIndex, 1);

      if (cache.shouldUpdateOnChange) {
        microMemoizeOptions.onCacheChange(cache, options, moized);
      }

      clearExpiration(cache, existingKey, true);

      return true;
    }

    return false;
  };

  moized.get = function (key: MicroMemoize.Key) {
    if (cache.canTransformKey) {
      key = microMemoizeOptions.transformKey(key);
    }

    const keyIndex = cache.getKeyIndex(key);

    if (keyIndex !== -1) {
      return cache.values[keyIndex];
    }
  };

  moized.getStats = function () {
    return getStats(options.profileName);
  };

  moized.has = function (key: MicroMemoize.Key) {
    const cacheKey = cache.canTransformKey
      ? microMemoizeOptions.transformKey(key)
      : key;

    return cache.getKeyIndex(cacheKey) !== -1;
  };

  moized.keys = function () {
    return cache.snapshot.keys;
  };

  moized.set = function (key: MicroMemoize.Key, value: MicroMemoize.Value) {
    const cacheKey = cache.canTransformKey ? microMemoizeOptions.transformKey(key) : key;

    const index = cache.getKeyIndex(cacheKey);
    const isAdd = index === -1;

    cache.orderByLru(cacheKey, value, isAdd ? cache.size : index);

    if (isAdd && cache.shouldUpdateOnAdd) {
      microMemoizeOptions.onCacheAdd(cache, options, moized);
    }

    if (cache.shouldUpdateOnChange) {
      microMemoizeOptions.onCacheChange(cache, options, moized);
    }

    return true;
  };

  moized.values = function () {
    return cache.snapshot.values;
  };

  enhanceCache(cache);

  return moized;
}

function getDisplayName(fn: Types.Moizeable) {
  return `Moized(${fn.displayName || fn.name || 'Component'})`;
}
