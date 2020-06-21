import { copyStaticProperties } from './instance';
import { Moize, Moizeable, Moized as MoizedResult, Options } from './types';

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

    function Moized(this: any, props: Record<string, any>, context: any, updater: any) {
        this.props = props;
        this.context = context;
        this.updater = updater;

        this.MoizedComponent = reactMoizer(fn);
    }

    Moized.prototype.isReactComponent = {};

    type MoizedElementType = {
        $$typeof: symbol | number;
        type: MoizedResult;
        props: Record<string, any>;
        ref: null;
        key: null;
        _owner: null;
    };

    // eslint-disable-next-line react/display-name
    Moized.prototype.render = function (): MoizedElementType {
        return this.MoizedComponent(this.props, this.context);
    };

    copyStaticProperties(fn, Moized, ['contextType']);

    Moized.displayName = `Moized(${fn.displayName || fn.name || 'Component'})`;

    return Moized;
}
