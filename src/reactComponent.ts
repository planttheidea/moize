/* globals define */

/* eslint-disable react/forbid-foreign-prop-types */
import { assign } from './utils';

import { Dictionary, Moizable, Moized, Options } from './types';

type Moizer<Fn extends Moizable> = (fn: Fn, options: Options) => Moized<Fn>;

const GLOBAL = (() => {
  if (typeof globalThis !== 'undefined') {
    // eslint-disable-next-line no-undef
    return globalThis;
  }

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-undef
    return window;
  }

  if (typeof global !== 'undefined') {
    return global;
  }
})();

const REACT_DOES_NOT_EXIST = 'You have tried to use the `isReact` option when React is not installed. Please install install `react` as a dependency of your project.';

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

let React: { createElement: Function } = GLOBAL && 'React' in GLOBAL && GLOBAL.React;

/**
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
  try {
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      // eslint-disable-next-line global-require,import/no-extraneous-dependencies
      React = require('react');
      // @ts-ignore
    } else if (typeof define === 'function' && define.amd) {
      // @ts-ignore
      define(['react'], (pkg: any) => {
        React = pkg;
      });
    } else {
      import('react')
        .catch(() => {
          throw new Error(REACT_DOES_NOT_EXIST);
        })
        .then((pkg: any) => {
          React = pkg;
        });
    }
  } catch {
    throw new Error(REACT_DOES_NOT_EXIST);
  }
}

export function createMemoizedComponent<Fn extends Moizable>(
  moize: Moizer<Fn>,
  fn: Fn,
  options?: Options,
) {
  const componentOptions = options ? assign({}, options, REACT_OPTIONS) : REACT_OPTIONS;

  type ComponentClass = import('react').ComponentClass<GenericProps, any>;
  type FunctionComponent = import('react').FunctionComponent;
  type GenericProps = import('react').Props<any>;

  if (!React) {
    loadReact();
  }

  /**
   * @NOTE This is basically creating a custom React.Component class
   *
   * Not only is this faster, it is also less code for the compiler to produce.
   */

  /* eslint-disable react/no-this-in-sfc */

  function MoizedComponent(props: GenericProps, context: Dictionary<any>, updater: any) {
    this.props = props;
    this.context = context;
    this.refs = EMPTY_OBJECT;
    this.updater = updater || ReactNoopUpdater;

    this.Moized = moize(fn, componentOptions);
  }

  MoizedComponent.prototype.isReactComponent = EMPTY_OBJECT;

  MoizedComponent.prototype.render = function () {
    return React.createElement((this.Moized as unknown) as FunctionComponent, this.props);
  };

  MoizedComponent.displayName = getDisplayName(fn);

  if (fn.propTypes) {
    MoizedComponent.propTypes = fn.propTypes;
  }

  if (fn.defaultProps) {
    MoizedComponent.defaultProps = fn.defaultProps;
  }

  /* eslint-enable */

  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  return (MoizedComponent as unknown) as ComponentClass;
}

export function getDisplayName(fn: Moizable) {
  return `Moized(${fn.displayName || fn.name || 'Component'})`;
}
