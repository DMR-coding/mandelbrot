define(['underscore'], function(_) {
    const operative = window.operative; // This lib needs to be imported as a script tag for odd scope reasons

    const MAX_ITERATIONS = 1000;

    function scoreRangeDivergence(x_scale, y_scale, min_x, min_y, width, height) {
        const scores = new Array(width * height);// - start);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                scores[x + y * width] = scoreDivergence(x * x_scale + min_x, y * y_scale + min_y);
            }
        }

        return scores;

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
        'scoreRangeDivergence': parallel.scoreRangeDivergence
    };
});