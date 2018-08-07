// @flow

export const createGetInitialArgs = (size: number) =>
  /**
   * @private
   *
   * @function getInitialArgs
   *
   * @description
   * take the first N number of items from the array (faster than slice)
   *
   * @param {Array<any>} args the args to take from
   * @returns {Array<any>} the shortened list of args as an array
   */
  (args: Array<any>): Array<any> => {
    if (size >= args.length) {
      return args;
    }

    switch (size) {
      case 0:
        return [];

      case 1:
        return [args[0]];

      case 2:
        return [args[0], args[1]];

      case 3:
        return [args[0], args[1], args[2]];

      case 4:
        return [args[0], args[1], args[2], args[3]];

      case 5:
        return [args[0], args[1], args[2], args[3], args[4]];
    }

    return Array.prototype.slice.call(args, 0, size);
  };
