# Migration from `moize` to `micro-memoize`

Historically, `micro-memoize` has been the core memoization engine powering `moize`, however as-of version 5 of `micro-memoize` most of the functionality that `moize` offers has been incorporated. Not only that, it is smaller and faster than `moize`! As such, maintaining `moize` no longer makes sense. This guide is to help with migration from `moize` to `micro-memoize`, because while the functionality is mostly the same, the way to access it has changed.

## Simple use case

The only thing necessary for the simple use case is that the import differs:

```ts
// before
import moize from 'moize';
import { fn } from './fn';

const memoized = moize(fn);

// after
import { memoize } from 'micro-memoize';
import { fn } from './fn';

const memoized = memoize(fn);
```

## Convenience methods are no longer available

If you want to apply options, then you will need to use them directly.

```ts
// before
const memoized = moize.maxArgs(2)(fn);

// after
const memoized = memoize(fn, { maxArgs: 2 });
```

## Currying of options is no longer available

If you want to merge options between multiple types, it is recommended to create a helper method.

```ts
// before
const selfUpdatingMemoized = moize({ updateExpire: true });

// after
function createSelfUpdatingMemoize<Fn extends (...args: any) => any>(fn: Fn) {
    return memoize(fn, { updateExpire: true });
}
```

## Options

Most option names have changed, mainly for clarity of purpose and intent. Some have been removed, but only if it worked incorrectly prior (oops!).

### isDeepEqual

This has changed to be a string value for the `isKeyItemEqual` option to identify the equality check is specific to key items.

```ts
// before
const memoized = moize(fn, { isDeepEqual: true });

// after
const memoized = memoize(fn, { isKeyItemEqual: 'deep' });
```

This is also true for [`isShallowEqual`](#isshallowequal).

### isPromise

This option has been renamed to `async`.

```ts
// before
const memoized = moize(fn, { isPromise: true });

// after
const memloized = memoize(fn, { async: true });
```

### isReact

**This option has been removed.**

This was created well before the existence of `React.memo`, which is the standard way to memoize React components today, so it is no longer needed. It also did not work with the latest version of React on methods using hooks.

### isSerialized

This option has been renamed to `serialize`.

```ts
// before
const memoized = moize(fn, { isSerialized: true });

// after
const memoized = memoize(fn, { serialize: true });
```

Additionally, if using a custom serializer then prior you would also need to pass the [`serializer`](#serializer) option, whereas the new `serialize` option handles both.

```ts
import { serializer } from './serializer';

// before
const memoized = moize(fn, { isSerialized: true, serializer });

// after
const memoized = memoize(fn, { serialize: serializer });
```

### isShallowEqual

This has changed to be a string value for the `isKeyItemEqual` option to identify the equality check is specific to key items.

```ts
// before
const memoized = moize(fn, { isShallowEqual: true });

// after
const memoized = memoize(fn, { isKeyItemEqual: 'shallow' });
```

This is also true for [`isDeepEqual`](#isdeepequal).

### matchesArg

This option has been renamed to `isKeyItemEqual`.

```ts
import { isEqual } from './isEqual';

// before
const memoized = moize({ matchesArg: isEqual });

// after
const memoized = memoize(fn, { isKeyItemEqual: isEqual });
```

This method now also receives a third parameter, which is the `index` of the argument in the key.

### matchesKey

This option has been renamed to `isKeyEqual`.

```ts
import { isEqual } from './isEqual';

// before
const memoized = moize(fn, { matchesKey: isEqual });

// after
const memoized = memoize(fn, { isKeyEqual: isEqual });
```

### maxAge

This option has been renamed to `expires`.

```ts
const FIVE_MINUTES = 300_000;

// before
const memoized = moize(fn, { maxAge: FIVE_MINUTES });

// after
const memoized = moize(fn, { expires: FIVE_MINUTES });
```

This has also merged with [`updateExpire`](#updateexpire), and been expanded to include additional options!

### profileName

This option has been renamed to `statsName`.

```ts
// before
const memoized = moize(fn, { profileName: 'foo' });

// after
const memoized = memoize(fn, { statsName: 'foo' });
```

Also, this field is now required for stats to be collected on the method, meaning if no `statsName` is provided, then statistics will never be collected.

### serializer

This option has been merged with the [`isSerialized`](#isserialized) option into `serialize`.

```ts
import { serializer } from './serializer';

// before
const memoized = moize(fn, { isSerialized: true, serializer });

// after
const memoized = memoize(fn, { serialize: serializer });
```

### transformArgs

This option has been renamed to `transformKey`.

```ts
import { keyTransformer } from './keyTransformer';

// before
const memoized = moize(fn, { transformArgs: keyTransformer });

// after
const memoized = memoize(fn, transformKey: keyTransformer });
```

### updateCacheForKey

This option has been renamed to `forceUpdate`.

```ts
// before
const memoized = moize(fn, {
    updateCacheForKey: (value) => !!value.stale,
});

// after
const memoized = memoize(fn, {
    forceUpdate: (value) => !!value.stale,
});
```

### updateExpire

This option has been merged into the new `expires` option as `update` on the configuration object.

```ts
const FIVE_MINUTES = 300_000;

// before
const memoized = moize(fn, { maxAge: FIVE_MINUTES, updateExpire: true });

// after
const memoized = memoize(fn, {
    expires: { after: FIVE_MINUTES, update: true },
});
```

## Cache change listeners

Cache change listeners have been updated to a more conventional event emitter setup, eliminating the clunky handlers and allowing dynamic add / removal of as many listeners as desired.

### onCacheAdd

This option has been replaced with a dedicated `add` listener on the cache.

```ts
// before
const memoized = moize(fn, {
    onCacheAdd: (cache) => {
        console.log({ key: cache.keys[0], value: cache.values[0] });
    },
});

// after
const memoized = memoize(fn);
memoized.cache.on('add', ({ key, value }) => {
    console.log({ key, value });
});
```

### onCacheChange

This option has been replaced with dedicated `add` and `update` listeners on the cache.

```ts
// before
const memoized = moize(fn, {
    onCacheChange: (cache) => {
        console.log({ key: cache.keys[0], value: cache.values[0] });
    },
});

// after
const memoized = memoize(fn);
memoized.cache.on('add', ({ key, value }) => {
    console.log('added', { key, value });
});
memoized.cache.on('update', ({ key, value }) => {
    console.log('updated', { key, value });
});
```

### onCacheHit

This option has been replaced with a dedicated `hit` listener on the cache.

```ts
// before
const memoized = moize(fn, {
    onCacheHit: (cache) => {
        console.log({ key: cache.keys[0], value: cache.values[0] });
    },
});

// after
const memoized = memoize(fn);
memoized.cache.on('hit', ({ key, value }) => {
    console.log({ key, value });
});
```

### onExpire

This option has been replaced with using the dedicated `delete` listeners on the cache.

```ts
const FIVE_MINUTES = 300_000;

// before
const memoized = moize(fn, {
    maxAge: FIVE_MINUTES,
    onExpire: (key) => {
        console.log(key);
    },
});

// after
const memoized = memoize(fn, { expires: FIVE_MINUTES });
memoized.cache.on('delete', ({ key, reason }) => {
    if (reason === 'expired') {
        console.log(key);
    }
});
```

## Stats

Statistics now require setting `statsName` on the functions intending to be profiled, and the start / stop of stats is now done with global methods.

```ts
// before
import moize from 'moize';

moize.collectStats(true);
const memoized = moize(fn);
console.log(moize.getStats());

// after
import { getStats, memoize, startCollectingStats } from 'micro-memoize';

startCollectingStats();
const memoized = memoize(fn, { statsName: 'foo' });
console.log(getStats());
```
