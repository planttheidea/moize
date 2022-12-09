import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import moize from '../src';
import { type Moized } from '../index.d';

type Props = {
    bar?: string;
    fn: (...args: any[]) => any;
    key?: string;
    object?: Record<string, any>;
    value?: any;
};

function ValueBar({ bar, fn, object, value }: Props) {
    console.count('react');
    console.log('react element fired', bar, fn, object, value);

    return (
        <div>
            {value} {bar}
        </div>
    );
}

ValueBar.propTypes = {
    bar: PropTypes.string.isRequired,
    fn: PropTypes.func.isRequired,
    object: PropTypes.object.isRequired,
    value: PropTypes.string.isRequired,
};

ValueBar.defaultProps = {
    bar: 'default',
};

const Memoized = moize.react(ValueBar);

const foo = 'foo';
const bar = 'bar';
const baz = 'baz';

const data = [
    {
        fn() {
            return foo;
        },
        object: { value: foo },
        value: foo,
    },
    {
        bar,
        fn() {
            return bar;
        },
        object: { value: bar },
        value: bar,
    },
    {
        fn() {
            return baz;
        },
        object: { value: baz },
        value: baz,
    },
];

type SimpleAppProps = {
    isRerender?: boolean;
};

class SimpleApp extends React.Component<SimpleAppProps> {
    MoizedComponent: Moized;

    componentDidUpdate() {
        console.log('post-update stats', this.MoizedComponent.getStats());
    }

    setMoizedComponent = (Ref: { MoizedComponent: Moized }) => {
        this.MoizedComponent = Ref.MoizedComponent;
    };

    render() {
        console.log('rendering simple app');

        const { isRerender } = this.props;

        return (
            <div>
                <h1 style={{ margin: 0 }}>App</h1>

                <div>
                    <h3>Memoized data list</h3>

                    {data.map((values, index) => (
                        <Memoized
                            key={`called-${values.value}`}
                            {...values}
                            isDynamic={index === 2 && isRerender}
                            ref={this.setMoizedComponent}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export function renderSimple(container: HTMLDivElement) {
    const simpleAppContainer = document.createElement('div');

    container.appendChild(simpleAppContainer);

    ReactDOM.render(<SimpleApp />, simpleAppContainer);

    setTimeout(() => {
        ReactDOM.render(<SimpleApp isRerender />, simpleAppContainer);
    }, 3000);
}
