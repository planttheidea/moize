'use strict';

const fibonacciSinglePrimitive = (number) => {
  return number < 2
    ? number
    : fibonacciSinglePrimitive(number - 1) +
        fibonacciSinglePrimitive(number - 2);
};

const fibonacciSingleArray = (array) => {
  return array[0] < 2
    ? array[0]
    : fibonacciSingleArray([array[0] - 1]) +
        fibonacciSingleArray([array[0] - 2]);
};
const fibonacciSingleObject = (object) => {
  return object.number < 2
    ? object.number
    : fibonacciSingleObject({ number: object.number - 1 }) +
        fibonacciSingleObject({ number: object.number - 2 });
};

const fibonacciMultiplePrimitive = (number, isComplete) => {
  if (isComplete) {
    return number;
  }

  const firstValue = number - 1;
  const secondValue = number - 2;

  return (
    fibonacciMultiplePrimitive(firstValue, firstValue < 2) +
    fibonacciMultiplePrimitive(secondValue, secondValue < 2)
  );
};

const fibonacciMultipleArray = (array, check) => {
  if (check[0]) {
    return array[0];
  }

  const firstValue = array[0] - 1;
  const secondValue = array[0] - 2;

  return (
    fibonacciMultipleArray([firstValue], [firstValue < 2]) +
    fibonacciMultipleArray([secondValue], [secondValue < 2])
  );
};

const fibonacciMultipleObject = (object, check) => {
  if (check.isComplete) {
    return object.number;
  }

  const firstValue = object.number - 1;
  const secondValue = object.number - 2;

  return (
    fibonacciMultipleObject(
      { number: firstValue },
      { isComplete: firstValue < 2 },
    ) +
    fibonacciMultipleObject(
      { number: secondValue },
      { isComplete: secondValue < 2 },
    )
  );
};

const number = 35;
const array = [number];
const object = { number };
const isCompleteBoolean = false;
const isCompleteArray = [false];
const isCompleteObject = { isComplete: false };

fibonacciSinglePrimitive(number);
fibonacciSinglePrimitive(number);
fibonacciSinglePrimitive(number);

fibonacciSingleArray(array);
fibonacciSingleArray(array);
fibonacciSingleArray(array);

fibonacciSingleObject(object);
fibonacciSingleObject(object);
fibonacciSingleObject(object);

fibonacciMultiplePrimitive(number, isCompleteBoolean);
fibonacciMultiplePrimitive(number, isCompleteBoolean);
fibonacciMultiplePrimitive(number, isCompleteBoolean);

fibonacciMultipleArray(array, isCompleteArray);
fibonacciMultipleArray(array, isCompleteArray);
fibonacciMultipleArray(array, isCompleteArray);

fibonacciMultipleObject(object, isCompleteObject);
fibonacciMultipleObject(object, isCompleteObject);
fibonacciMultipleObject(object, isCompleteObject);
