import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import moize, { Moized } from '../src';
import { copyStaticProperties } from '../src/instance';

describe('moize.react', () => {
    type ValueBarProps = {
        bar?: string;
        fn: (...args: any[]) => any;
        key?: string;
        object?: Record<string, unknown>;
        value?: any;
    };

    function _ValueBar({ bar, value }: ValueBarProps) {
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

    const ValueBar = jest.fn(_ValueBar) as (
        props: ValueBarProps
    ) => JSX.Element;

    // force static properties to be passed to mock
    copyStaticProperties(_ValueBar, ValueBar);

    const Memoized = moize.react(ValueBar);

    it('should have the correct static values', () => {
        expect(Memoized.propTypes).toBe(_ValueBar.propTypes);
        expect(Memoized.defaultProps).toBe(_ValueBar.defaultProps);
        expect(Memoized.displayName).toBe(`Moized(${ValueBar.name})`);
    });

    it('should memoize the component renders', () => {
        type Props = { id: string; unused?: boolean };

        const Component = ({ id }: Props) => <div id={id} />;
        const ComponentSpy = jest.fn(Component) as typeof Component;
        const MoizedComponent = moize.react(ComponentSpy);
        const App = ({ id, unused }: Props) => (
            <MoizedComponent id={id} unused={unused} />
        );

        const app = document.createElement('div');

        document.body.appendChild(app);

        new Array(100).fill('id').forEach((id, index) => {
            ReactDOM.render(<App id={id} unused={index === 53} />, app);
        });

        // The number of calls is 3 because cache breaks twice, when `unused` prop is toggled.
        expect(ComponentSpy).toHaveBeenCalledTimes(3);
    });

    it('should memoize the component renders with custom options', () => {
        type Props = { id: string; unused?: boolean };

        const Component = ({ id }: Props) => <div id={id} />;
        const ComponentSpy = jest.fn(Component) as typeof Component;
        const MoizedComponent = moize.react(ComponentSpy, { maxSize: 2 });
        const App = ({ id, unused }: Props) => (
            <MoizedComponent id={id} unused={unused} />
        );

        const app = document.createElement('div');

        document.body.appendChild(app);

        new Array(100).fill('id').forEach((id, index) => {
            ReactDOM.render(<App id={id} unused={index === 53} />, app);
        });

        // The number of calls is 2 because both `unused` values are stored in cache.
        expect(ComponentSpy).toHaveBeenCalledTimes(2);
    });

    it('should memoize the component renders including legacy context', () => {
        type Props = { id: string; unused?: boolean };

        const Component = ({ id }: Props) => <div id={id} />;
        const ComponentSpy = jest.fn(
            Component
        ) as unknown as typeof Component & {
            contextTypes: Record<string, any>;
        };

        ComponentSpy.contextTypes = { unused: PropTypes.bool.isRequired };

        const MoizedComponent = moize.react(ComponentSpy);

        class App extends React.Component<Props> {
            static childContextTypes = {
                unused: PropTypes.bool.isRequired,
            };

            getChildContext() {
                return {
                    unused: this.props.unused,
                };
            }

            render() {
                return <MoizedComponent id={this.props.id} />;
            }
        }

        const app = document.createElement('div');

        document.body.appendChild(app);

        new Array(100).fill('id').forEach((id, index) => {
            ReactDOM.render(<App id={id} unused={index === 53} />, app);
        });

        // The number of calls is 3 because cache breaks twice, when `unused` context value is toggled.
        expect(ComponentSpy).toHaveBeenCalledTimes(3);
    });

    it('should memoize on a per-instance basis on render', async () => {
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

        class App extends React.Component<{ isRerender?: boolean }> {
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

        function renderApp(
            isRerender?: boolean,
            onRender?: (value?: unknown) => void
        ) {
            ReactDOM.render(<App isRerender={isRerender} />, app, onRender);
        }

        const app = document.createElement('div');

        document.body.appendChild(app);

        renderApp();

        expect(ValueBar).toHaveBeenCalledTimes(data.length);

        await new Promise((resolve) =>
            setTimeout(() => {
                renderApp(true, resolve);
            }, 1000)
        );

        expect(ValueBar).toHaveBeenCalledTimes(data.length + 1);
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

    describe('edge cases', () => {
        it('should retain the original function name', () => {
            function MyComponent(): null {
                return null;
            }

            const memoized = moize.react(MyComponent);

            expect(memoized.name).toBe('moized(MyComponent)');
        });
    });
});
