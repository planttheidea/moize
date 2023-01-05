import { copyStaticProperties } from './instance';
import { setName } from './utils';

import type {
    Moize,
    Moized as MoizedFunction,
    Moizeable,
    Options,
} from '../index.d';

// This was stolen from React internals, which allows us to create React elements without needing
// a dependency on the React library itself.
const REACT_ELEMENT_TYPE =
    typeof Symbol === 'function' && Symbol.for
        ? Symbol.for('react.element')
        : 0xeac7;

/**
 * @private
 *
 * @description
 * Create a component that memoizes based on `props` and legacy `context`
 * on a per-instance basis. This requires creating a component class to
 * store the memoized function. The cost is quite low, and avoids the
 * need to have access to the React dependency by basically re-creating
 * the basic essentials for a component class and the results of the
 * `createElement` function.
 *
 * @param moizer the top-level moize method
 * @param fn the component to memoize
 * @param options the memoization options
 * @returns the memoized component
 */
export function createMoizedComponent<MoizeableFn extends Moizeable>(
    moizer: Moize,
    fn: MoizeableFn,
    options: Options<MoizeableFn>
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

    function Moized<Props extends Record<string, unknown>, Context, Updater>(
        this: any,
        props: Props,
        context: Context,
        updater: Updater
    ) {
        this.props = props;
        this.context = context;
        this.updater = updater;

        this.MoizedComponent = reactMoizer(fn);
    }

    Moized.prototype.isReactComponent = {};

    Moized.prototype.render = function (): ReturnType<MoizeableFn> {
        return {
            $$typeof: REACT_ELEMENT_TYPE,
            type: this.MoizedComponent,
            props: this.props,
            ref: null,
            key: null,
            _owner: null,
        } as ReturnType<MoizeableFn>;
    };

    copyStaticProperties(fn, Moized, ['contextType', 'contextTypes']);

    Moized.displayName = `Moized(${fn.displayName || fn.name || 'Component'})`;

    setName(Moized as MoizedFunction, fn.name, options.profileName);

    return Moized;
}
