# moize CHANGELOG

#### 2.1.4
* Move multiple-parameter key matching to cache (allows for custom `cache` to have its own implementation)
* Update documentation for the custom `cache` implementation, as it requires `getMultiParamKey` now, plus give a better example of an alternative `cache`
* Make `keys()` and `values()` methods no-ops when cache implementation is custom
* Make `deleteItemFromCache` method safe with custom `cache` implementations

#### 2.1.3
* Enhance `Cache` more for multiple-parameter functions (now benchmarks faster in all categories)

#### 2.1.2
* Have `areArraysShallowEqual` use `isEqual` instead of strict equality to allow for `NaN` as key

#### 2.1.1
* Optimize cache class to be more efficient in both `has` and `get` operations
* Fix issue with `delete` that was preventing delete of falsy keys

#### 2.1.0
* Add `add` method on cache to allow for manual cache insertion

#### 2.0.3
* Ensure `maxArgs` is respected for unserialized functions
* Change the arguments length check from `=== 1` to `> ` so that zero arguments (`undefined` key) pulls from cache directly instead of tries to go through key matching for multiparam

#### 2.0.2
* Prevent memoization on `moize.react` based on third parameter to functional components (object of all internal react functions)

#### 2.0.1
* Fix static types applied to functional components not being applied to memoized component

#### 2.0.0
* Refactor to use object equality instead of serialization (vast speed improvements over 1.x.x with multiple parameters)
* Breaking changes:
  * If you were relying on the serialization (using value equality instead of object equality), it will no longer memoize (you can set `serialize: true` if you want to continue using that option)
  * If you were using `moize` to memoize React components, you should change your invocations from `moize` to `moize.react` ([see README](README.md#usage-with-functional-react-components))

#### 1.5.0
* Add `values` method on memoized function (gets list of computed values stored in cache)
* Fix issue with `clear` method not being present on `Cache`

#### 1.4.5
* Switch to using Cache for caching instead of native Map (was previously only used for polyfilling, but is twice as fast ... I feel silly for not testing its performance prior)
* Simplify and optimize Cache to crank out as much speed as possible

#### 1.4.4
* Add `displayName` property to memoized function for better display of memoized `react` components in DevTools
* Throw a `TypeError` when the parameter passed to moize is not a function

#### 1.4.3
* Move internal serializer generation to utils, for further partial application leveraging

#### 1.4.2
* Leverage partial functions in a number of places (less arguments passed around, improves performance by ~6%)

#### 1.4.1
* Correct README error explaining `serializeFunctions` option

#### 1.4.0
* Add `serializeFunctions` option

#### 1.3.3
* Ensure all numeric parameters (`maxAge`, `maxArgs`, `maxSize`) are a finite positive integer

#### 1.3.2
* Replace array-based decycle with Map (performance on circular objects)

#### 1.3.1
* Fix README errors

#### 1.3.0
* Add keys method to memoized function, to know the size and also get keys for potential deletion
* Update decycle method with modern techniques and helper functions for better circular reference performance

#### 1.2.0
* Add `maxArgs` configuration option to limit the number of arguments to use in the key creation for cache

#### 1.1.2
* Remove external dependencies in favor of local `Cache` and `decycle` implementation (smaller bundle size)

#### 1.1.1
* Make handling of circular handling automatic by stringifying in `try` / `catch`, and remove manual `isCircular` configuration option

#### 1.1.0
* Add `cycle` dependency to handle circular objects
* Add `clear` and `delete` methods on the memoized function to allow for direct cache manipulation

#### 1.0.3
* Remove warning related to `map-or-similar` dependency consumption

#### 1.0.2
* Remove no-longer-needed dependencies

#### 1.0.1
* Remove unneeded folders and files from npm package

#### 1.0.0
* Initial release
