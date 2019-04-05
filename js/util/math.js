define(['underscore'], function(_) {
    const operative = window.operative; // This lib needs to be imported as a script tag for odd scope reasons

    const MAX_ITERATIONS = 1000;

    // FIXME: There's an off-by-one error somewhere that's causing empty pixels between the work units and
    // skewing the resulting image
    function scoreRangeDivergence(start, end, x_scale, y_scale, min_x, min_y, width, height) {
        const scores = new Array(end - start - 1);

        let flat_index = 0;
        let first_inner_loop = true;
        let initial_y = Math.floor(start / width);

          for (let y = initial_y; y < height; y++) {
              let x = 0;
              if (y === initial_y) {
                  console.log(x, y);
                  x = start % width;
              }
              for (/*pass*/; x < width; x++) {
                scores[flat_index] = scoreDivergence(x * x_scale + min_x, y * y_scale + min_y);
                //scores[flat_index] = ; //scoreDivergence(x * x_scale + min_x, y * y_scale + min_y);

                flat_index++;
                if((flat_index + start) >= (end - 1)){
                    console.log(x, y);
                    return scores;
                }
            }
            first_inner_loop = false;
        }

        // The mandelbrot set consists of points in complex space where iteratively applying a certain function to
        // the point's coordinate does not cause the value to approach infinity. However, in an explorer, the
        // *actual* mandelbrot set is the dull region in the middle of all the fun colors-- those are actually
        // points _near_ the set. They are given a score based on how many iterations it takes for them to diverge
        // (approach infinity) which makes for the most interesting visuals.
        function scoreDivergence(lx, ly) {
            const MAX_ITERATIONS = 1000; // Gotta repeat this so this function body doesnt' have any external reference, for workerization purposes

            let x = 0.0;
            let y = 0.0;

            let iteration = 0;

            while ((((x * x) + (y * y)) < 0xF00) && (iteration < MAX_ITERATIONS)) {
                const tx = ((x * x) - (y * y)) + lx;
                y = (2 * x * y) + ly;
                x = tx;
                iteration += 1;
            }

            if (iteration < MAX_ITERATIONS) {
                const zn = Math.sqrt((x * x) + (y * y));
                const nu = Math.log(Math.log(zn) / Math.log(2)) / Math.log(2);
                iteration = (iteration + 1) - nu;
            }

            return iteration;
        }
    }

    // Operative is an implicitly-imported library. It does some kind of scoping magic w/ the browser
    // that doesn't work if it's not used as a script tag.
    const parallel = operative({
        scoreRangeDivergence: scoreRangeDivergence
    });

    return {
        'MAX_ITERATIONS': MAX_ITERATIONS,
        // 'scoreDivergence': scoreDivergence,
        'scoreRangeDivergence': scoreRangeDivergence
    };
});