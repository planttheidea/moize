import { RefObject, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { moize } from '../src';

interface ValueProps {
    bar?: string;
    fn: (...args: any[]) => any;
    isDynamic?: boolean;
    key?: string;
    object?: Record<string, any>;
    ref?: RefObject<any>;
    value?: any;
}

function ValueBar({ bar, fn, object, value }: ValueProps) {
    console.count('react');
    console.log('react element fired', bar, fn, object, value);

    return (
        <div>
            {value} {bar}
        </div>
    );
}

ValueBar.defaultProps = {
    bar: 'default',
};

const Memoized = moize(ValueBar, { react: true });

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

function App() {
    const [rerender, setRerender] = useState(false);
    const ref = useRef<any>(null);

    useEffect(() => {
        setTimeout(() => {
            setRerender(true);
        }, 3000);

        console.log(ref);
    }, []);

    return (
        <div>
            <h1 style={{ margin: 0 }}>App</h1>

            <div>
                <h3>Memoized data list</h3>

                {data.map((values, index) => (
                    <Memoized
                        key={`called-${values.value}`}
                        {...values}
                        isDynamic={index === 2 && rerender}
                        ref={ref}
                    />
                ))}
            </div>
        </div>
    );
}

export function render(container: HTMLDivElement) {
    const appContainer = document.createElement('div');

    container.appendChild(appContainer);

    const root = createRoot(appContainer);

    root.render(<App />);
}
