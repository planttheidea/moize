import type { Options as MicroMemoizeOptions } from 'micro-memoize';
import { ComponentProps, ComponentType } from 'react';
import { createMoized } from './instance';
import { Moizable, Options } from './internalTypes';

function getElementType<Fn extends Moizable>({ react }: Options<Fn>) {
    // This was stolen from React internals, which allows us to create React elements without needing
    // a dependency on the React library itself.
    return react === true || react === '19'
        ? Symbol.for('react.transitional.element')
        : Symbol.for('react.element');
}

/**
 * Create a component that memoizes based on `props` and legacy `context`
 * on a per-instance basis. This requires creating a component class to
 * store the memoized function. The cost is quite low, and avoids the
 * need to have access to the React dependency by basically re-creating
 * the basic essentials for a component class and the results of the
 * `createElement` function.
 */
export function getWrappedReactMoize<
    Fn extends Moizable,
    Opts extends Options<Fn>,
>(
    fn: Fn,
    microMemoizeOptions: MicroMemoizeOptions<Fn>,
    options: Opts,
): ComponentType<ComponentProps<Fn>> {
    const elementType = getElementType(options);

    function Moized<Props extends Record<string, unknown>, Context, Updater>(
        this: any,
        props: Props,
        context: Context,
        updater: Updater,
    ) {
        this.props = props;
        this.context = context;
        this.updater = updater;

        this.refs = {};

        this.MoizedComponent = createMoized(fn, microMemoizeOptions, options);
    }

    Moized.prototype.isReactComponent = {};

    Moized.prototype.render = function (): ReturnType<Fn> {
        return {
            $$typeof: elementType,
            type: this.MoizedComponent,
            props: this.props,
            ref: null,
            key: null,
            _owner: null,
        } as ReturnType<Fn>;
    };

    Moized.displayName = `Moized(${fn.displayName || fn.name || 'Component'})`;

    return Moized as ComponentType<ComponentProps<Fn>>;
}
