import type {
    Component,
    ComponentProps,
    ComponentType,
    RefObject,
} from 'react';
import { createMoized } from './moize.js';
import type { Moizeable, Moized, Options } from './internalTypes.ts';

interface MoizedComponent<Fn extends Moizeable, Props>
    extends Component<Props> {
    Moized: Moized<Fn, Options<Fn>>;
    refs: Record<string, RefObject<any>>;
    updater: any;
}

/**
 * Create a component that memoizes based on `props` and legacy `context`
 * on a per-instance basis. This requires creating a component class to
 * store the memoized function. The cost is quite low, and avoids the
 * need to have access to the React dependency by basically re-creating
 * the basic essentials for a component class and the results of the
 * `createElement` function.
 */
export function createWrappedReactMoize<
    Fn extends Moizeable,
    Opts extends Options<Fn>,
>(fn: Fn, options: Opts): ComponentType<ComponentProps<Fn>> {
    const elementType = getElementType(options);

    function Moized<Props extends ComponentProps<Fn>, Context, Updater>(
        this: MoizedComponent<Fn, Props>,
        props: Props,
        context: Context,
        updater: Updater,
    ) {
        // @ts-expect-error - Allow assignment to `props`, since this is
        // the constructor.
        this.props = props;
        this.context = context;
        this.updater = updater;

        this.refs = {};

        this.Moized = createMoized(fn, options);
    }

    Moized.prototype.isReactComponent = {};

    Moized.prototype.render = function (
        this: MoizedComponent<Fn, ComponentProps<Fn>>,
    ): ReturnType<Fn> {
        return {
            $$typeof: elementType,
            type: this.Moized,
            props: this.props,
            ref: null,
            key: null,
            _owner: null,
        } as ReturnType<Fn>;
    };

    Moized.displayName = `Moized(${fn.displayName || fn.name || 'Component'})`;

    return Moized as ComponentType<ComponentProps<Fn>>;
}

function getElementType<Fn extends Moizeable>({ react }: Options<Fn>) {
    // This was stolen from React internals, which allows us to create React elements without needing
    // a dependency on the React library itself.
    return react === true || react === 19
        ? Symbol.for('react.transitional.element')
        : Symbol.for('react.element');
}
