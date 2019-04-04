define(['underscore'], function(_){
  const MAX_ITERATIONS = 1000;

  // The mandelbrot set consists of points in complex space where iteratively applying a certain function to
  // the point's coordinate does not cause the value to approach infinity. However, in an explorer, the
  // *actual* mandelbrot set is the dull region in the middle of all the fun colors-- those are actually
  // points _near_ the set. They are given a score based on how many iterations it takes for them to diverge
  // (approach infinity) which makes for the most interesting visuals.
  function scoreDivergence(lx, ly) {
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