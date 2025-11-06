import type { Key } from '../index.d';

export function createGetInitialArgs(size: number) {
    /**
     * @private
     *
     * @description
     * take the first N number of items from the array (faster than slice)
     *
     * @param args the args to take from
     * @returns the shortened list of args as an array
     */
    return function (args: Key): Key {
        if (size >= args.length) {
            return args;
        }

        if (size === 0) {
            return [];
        }

        if (size === 1) {
            return [args[0]];
        }

        if (size === 2) {
            return [args[0], args[1]];
        }

        if (size === 3) {
            return [args[0], args[1], args[2]];
        }

        const clone = [];

        for (let index = 0; index < size; index++) {
            clone[index] = args[index];
        }

        return clone;
    };
}
