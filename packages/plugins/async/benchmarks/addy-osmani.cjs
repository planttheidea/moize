/*
 * memoize.js
 * by @philogb and @addyosmani
 * with further optimizations by @mathias
 * and @DmitryBaranovsk
 * perf tests: http://bit.ly/q3zpG3
 * Released under an MIT license.
 */
module.exports = function memoize(fn) {
  return function(...args) {
    let index = args.length,
        hash = '',
        currentArg = null;

    currentArg = null;

    while (index--) {
      currentArg = args[index];
      hash += currentArg === Object(currentArg) ? JSON.stringify(currentArg) : currentArg;

      fn.memoize || (fn.memoize = {});
    }

    return hash in fn.memoize ? fn.memoize[hash] : (fn.memoize[hash] = fn.apply(this, args));
  };
};
