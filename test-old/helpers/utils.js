/**
 * @function sleep
 *
 * @description
 * utility to provide delay of processing
 *
 * @param {number} ms the number of milliseconds to delay
 * @returns {Promise} the promise to be resolved after ms
 */
export const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
