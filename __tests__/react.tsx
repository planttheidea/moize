import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import moize, { Moized } from '../src';

type Props = {
    bar?: string;
    fn: (...args: any[]) => any;
    key?: string;
    object?: Record<string, unknown>;
    value?: any;
};

function _ValueBar({ bar, value }: Props) {
    return (
        <div>
            {value} {bar}
        </div>
    );
}

_ValueBar.propTypes = {
    bar: PropTypes.string.isRequired,
    fn: PropTypes.func.isRequired,
    object: PropTypes.object.isRequired,
    value: PropTypes.string.isRequired,
};

_ValueBar.defaultProps = {
    bar: 'default',
};

const ValueBar = jest.fn(_ValueBar) as (props: Props) => JSX.Element;

// force static properties to be passed to mock
Object.assign(ValueBar, _ValueBar);

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

    componentDidMount() {
        expect(ValueBar).toHaveBeenCalledTimes(3);
    }

    componentDidUpdate() {
        // only one component rerendered based on dynamic props
        expect(ValueBar).toHaveBeenCalledTimes(4);
    }

    setMoizedComponent = (Ref: { MoizedComponent: Moized }) => {
        this.MoizedComponent = Ref.MoizedComponent;
    };

    render() {
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

describe('moize.react', () => {
    it('should have the correct static values', () => {
        expect(Memoized.propTypes).toBe(_ValueBar.propTypes);
        expect(Memoized.defaultProps).toBe(_ValueBar.defaultProps);
        expect(Memoized.displayName).toBe(`Moized(${ValueBar.name})`);
    });

    it('should memoize on a per-instance basis on render', async (done) => {
        const app = document.createElement('div');

        document.body.appendChild(app);

        ReactDOM.render(<SimpleApp />, app);

        expect(ValueBar).toHaveBeenCalledTimes(data.length);

        await new Promise((resolve) => setTimeout(resolve, 1000));

        ReactDOM.render(<SimpleApp isRerender />, app, () => {
            expect(ValueBar).toHaveBeenCalledTimes(data.length + 1);
            done();
        });
    });

    it('should allow use of hooks', async () => {
        const timing = 1000;
        const app = document.createElement('div');

        document.body.appendChild(app);

        const spy = jest.fn();
        const TestComponent = moize.react(() => {
            const [txt, setTxt] = React.useState(0);

            React.useEffect(() => {
                setTimeout(() => {
                    setTxt(Date.now());
                    spy();
                }, timing);
            }, []);

            return <span>{txt}</span>;
        });

        ReactDOM.render(<TestComponent />, app);

        expect(spy).not.toHaveBeenCalled();

        await new Promise((resolve) => setTimeout(resolve, timing + 200));

        expect(spy).toHaveBeenCalled();
    });
});
