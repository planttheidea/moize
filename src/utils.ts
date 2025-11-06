/**
 * Compose functions into a single function.
 */
export function compose<Method>(...functions: Method[]): Method {
    return functions.reduce(function (f: any, g: any) {
        if (typeof f === 'function') {
            return typeof g === 'function'
                ? function (this: any) {
                      return f(g.apply(this, arguments));
                  }
                : f;
        }

        if (typeof g === 'function') {
            return g;
        }
    });
}
