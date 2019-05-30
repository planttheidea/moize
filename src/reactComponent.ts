// eslint-disable-next-line import/no-extraneous-dependencies
import React, { ComponentClass, FunctionComponent, Props } from 'react';

import { assign } from './utils';

import { Dictionary, Moized, Options } from './types';

type Moizer<Fn extends Function> = (fn: Fn, options: Options) => Moized<Fn>;

const REACT_OPTIONS = { isReact: true, isReactGlobal: true };

type FunctionalComponent = Function & {
  defaultProps?: Dictionary<any>;
  propTypes?: Dictionary<Function>;
};

export function createMemoizedComponent<Fn extends FunctionalComponent>(
  moize: Moizer<Fn>,
  fn: Fn,
  options?: Options,
) {
  const componentOptions = options ? assign({}, options, REACT_OPTIONS) : REACT_OPTIONS;

  if (options.isReactGlobal) {
    return moize(fn, componentOptions);
  }

  type GenericProps = Props<any>;
  type MoizedComponentClass = ComponentClass<GenericProps, any>;

  // eslint-disable-next-line global-require,import/no-extraneous-dependencies
  return class MoizedComponent extends React.Component {
    Moized: Moized<Fn>;

    props: GenericProps;

    static displayName = getDisplayName(fn);

    static propTypes = fn.propTypes;

    static defaultProps = fn.defaultProps;

    constructor(props: GenericProps) {
      super(props);

      this.Moized = moize(fn, componentOptions);
    }

    render() {
      return React.createElement((this.Moized as unknown) as FunctionComponent, this.props);
    }
  } as MoizedComponentClass;
}

export function getDisplayName(fn: Function & { displayName?: string }) {
  return `Moized(${fn.displayName || fn.name || 'Component'})`;
}
