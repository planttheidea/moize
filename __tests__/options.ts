/* globals describe,expect,it,jest */

// test
import { deepEqual, shallowEqual, sameValueZeroEqual } from 'fast-equals';

// src
import { getIsEqual, getIsMatchingKey, getTransformKey } from '../src/options';
import { getIsSerializedKeyEqual } from '../src/serialize';

describe('getIsEqual', () => {
  it('should return equals if passed in options', () => {
    const moizeOptions = {
      equals: jest.fn(),
      isDeepEqual: true,
      isReact: true,
    };

    const isEqual = getIsEqual(moizeOptions);

    expect(isEqual).toBe(moizeOptions.equals);
  });

  it('should return deepEqual if isDeepEqual is true', () => {
    const moizeOptions = {
      isDeepEqual: true,
      isReact: true,
    };

    const isEqual = getIsEqual(moizeOptions);

    expect(isEqual).toBe(deepEqual);
  });

  it('should return shallowEqual if isReact is true', () => {
    const moizeOptions = {
      isDeepEqual: false,
      isReact: true,
    };

    const isEqual = getIsEqual(moizeOptions);

    expect(isEqual).toBe(shallowEqual);
  });

  it('should return sameValueZeroEqual as an ultimate fallback', () => {
    const moizeOptions = {
      isDeepEqual: false,
      isReact: false,
    };

    const isEqual = getIsEqual(moizeOptions);

    expect(isEqual).toBe(sameValueZeroEqual);
  });
});

describe('getIsMatchingKey', () => {
  it('should return the matchesKey function if passed', () => {
    const moizeOptions = {
      isSerialized: true,
      matchesKey: jest.fn(),
    };

    const isMatchingKey = getIsMatchingKey(moizeOptions);

    expect(isMatchingKey).toBe(moizeOptions.matchesKey);
  });

  it('should return the default is serialized key equal method when no matchesKey is passed', () => {
    const moizeOptions = {
      isSerialized: true,
    };

    const isMatchingKey = getIsMatchingKey(moizeOptions);

    expect(isMatchingKey).toBe(getIsSerializedKeyEqual);
  });
});

describe('getTransformKey', () => {
  it('should not return a function when not required', () => {
    const moizeOptions = {
      isReact: false,
      isSerialized: false,
    };

    const result = getTransformKey(moizeOptions);

    expect(result).toBe(undefined);
  });

  it('should get the initial args if maxArgs is a number', () => {
    const moizeOptions = {
      isReact: false,
      isSerialized: false,
      maxArgs: 1,
    };

    const transformKey = getTransformKey(moizeOptions);

    if (typeof transformKey !== 'function') {
      throw new Error('transformKey should be a function');
    }

    const args = ['one', 'two', 'three'];

    expect(transformKey(args)).toEqual(args.slice(0, 1));
  });

  it('should get the first two args if isReact is true', () => {
    const moizeOptions = {
      isReact: true,
      isSerialized: false,
    };

    const transformKey = getTransformKey(moizeOptions);

    if (typeof transformKey !== 'function') {
      throw new Error('transformKey should be a function');
    }

    const args = ['one', 'two', 'three'];

    expect(transformKey(args)).toEqual(args.slice(0, 2));
  });

  it('should serialize the args if isSerialized is true', () => {
    const moizeOptions = {
      isReact: false,
      isSerialized: true,
    };

    const transformKey = getTransformKey(moizeOptions);

    if (typeof transformKey !== 'function') {
      throw new Error('transformKey should be a function');
    }

    const args = ['one', 'two', 'three'];

    expect(transformKey(args)).toEqual(['|one|two|three|']);
  });

  it('should call transformArgs if passed', () => {
    const moizeOptions = {
      isReact: false,
      isSerialized: false,
      transformArgs(args: any[]) {
        return [...args].reverse();
      },
    };

    const transformKey = getTransformKey(moizeOptions);

    if (typeof transformKey !== 'function') {
      throw new Error('transformKey should be a function');
    }

    const args = ['one', 'two', 'three'];

    expect(transformKey(args)).toEqual([...args].reverse());
  });

  it('should compose all transforms in the correct order', () => {
    const moizeOptions = {
      isReact: true,
      isSerialized: true,
      maxArgs: 1,
      transformArgs(args: any[]) {
        return [
          args[0]
            .split('')
            .reverse()
            .join(''),
        ];
      },
    };

    const transformKey = getTransformKey(moizeOptions);

    if (typeof transformKey !== 'function') {
      throw new Error('transformKey should be a function');
    }

    const args = ['one', 'two', 'three'];

    expect(transformKey(args)).toEqual(['|eno|']);
  });
});
