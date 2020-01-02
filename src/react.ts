import { Moize, Moizeable, Options } from './types';
const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Copying React internals for the internal $$typeof value used
 * for React.createElement. This allows us to declare the objects
 * inline in the `render` methods, avoiding the need to make React
 * a dependency.
 */
const $$typeof = typeof Symbol === 'function' && Symbol.for ? Symbol.for('react.element') : 0xeac7;

/**
 * @private
 *
 * @description
 * Create a component that memoizes based on `props` and legacy `context`
 * on a per-instance basis. This requires creating a component class to
 * store the memoized function on, and then a functional component to render
 * this class.
 *
 * While this may seem like overkill, the cost is quite low and avoids the
 * need to have access to the React dependency.
 *
 * @param moizer the top-level moize method
 * @param fn the component to memoize
 * @param options the memoization options
 * @returns the memoized component
 */
export function createMoizedComponent<OriginalFn extends Moizeable>(
  moizer: Moize,
  fn: OriginalFn,
  options: Options
) {
  /**
   * This is a hack override setting the necessary options
   * for a React component to be memoized. In the main `moize`
   * method, if the `isReact` option is set it is short-circuited
   * to call this function, and these overrides allow the
   * necessary transformKey method to be derived.
   *
   * The order is based on:
   * 1) Set the necessary aspects of transformKey for React components.
   * 2) Allow setting of other options and overrides of those aspects
   *    if desired (for example, `isDeepEqual` will use deep equality).
   * 3) Always set `isReact` to false to prevent infinite loop.
   */
  const reactMoizer = moizer({
    maxArgs: 2,
    isShallowEqual: true,
    ...options,
    isReact: false,
  });

  if (!fn.displayName) {
    // @ts-ignore - allow setting of displayName
    fn.displayName = fn.name || 'Component';
  }

  function MoizeWrapper(props: object, context: any, updater: any) {
    this.props = props;
    this.context = context;
    this.updater = updater;

    this.Moized = reactMoizer(fn);
  }

  MoizeWrapper.prototype.isReactComponent = {};

  // eslint-disable-next-line react/display-name
  MoizeWrapper.prototype.render = function() {
    return {
      $$typeof,
      type: this.Moized,
      props: this.props,
      ref: null,
      key: null,
      _owner: null,
    };
  };

  MoizeWrapper.displayName = 'MoizeWrapper';

  function Moized<Props = {}>(props: Props) {
    return {
      $$typeof,
      type: MoizeWrapper,
      props,
      ref: null,
      key: null,
      _owner: null,
    };
  }

  for (const staticProperty in fn) {
    if (staticProperty.indexOf('context') === -1 && hasOwnProperty.call(fn, staticProperty)) {
      Moized[staticProperty as keyof typeof Moized] = fn[staticProperty];
    }
  }

  Moized.displayName = `Moized(${fn.displayName || fn.name || 'Component'})`;

  return Moized;
}
