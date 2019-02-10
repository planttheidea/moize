const { slice } = Array.prototype;

export function createGetInitialArgs(size: number) {
  return function getInitialArgs(args: any[]) {
    if (size >= args.length) {
      return args;
    }

    if (!size) {
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

    return slice.call(args, 0, size);
  };
}
