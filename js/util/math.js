define(['underscore'], function(_){
  'use strict';
  const MAX_ITERATIONS = 1000;

  function scoreDivergence(point) {
    const [lx, ly] = point;
    let x = 0.0;
    let y = 0.0;

    let iteration = 0;

    while ((((x*x) + (y*y)) < 0xF00) && (iteration < MAX_ITERATIONS)) {
      const tx = ((x*x) - (y*y)) + lx;
      y = (2*x*y) + ly;
      x = tx;
      iteration += 1;
    }

    if (iteration < MAX_ITERATIONS) {
      const zn = Math.sqrt((x*x) + (y*y));
      const nu = Math.log( Math.log(zn) / Math.log(2)) / Math.log(2);
      iteration = (iteration + 1) - nu;
    }

    return iteration;
  }

  return {
      'MAX_ITERATIONS': MAX_ITERATIONS,
      'scoreDivergence': scoreDivergence
  }
});