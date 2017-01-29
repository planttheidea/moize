# moize CHANGELOG

#### 1.4.5
* Switch to using MapLike for caching instead of native Map (was previously only used for polyfilling, but is twice as fast ... I feel silly for not testing its performance prior)

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
* Remove external dependencies in favor of local `MapLike` and `decycle` implementation (smaller bundle size)

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
