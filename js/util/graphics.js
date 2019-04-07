//the GPU lib is supposed to be AMD compatible, but its AMD support is kinda broken.
// Requiring it actually does cause it to be loaded, so don't remove it as a dependency, but it just winds up
// registered as window.GPU
define(['underscore', 'util/math',  'GPU'], function(_, math, _GPU) {
    const MAX_COLOR_VALUE = 1.0;

    const INTENSITY_CUTOFF = 0.85;
    const HIGH_INTENSITY_WEIGHT = 1 / (1- INTENSITY_CUTOFF);

    // The mandelbrot set has extremely (infinitely...) fine detail and aliasing sticks out like a sore thumb,
    // so even though it's slow, we render multiple points per pixel.
    const PIXEL_RATIO = 2;

    function getMouseCoord(e, element) {
        const rect = element.getBoundingClientRect();
        return [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)];
    }

    function scoreToColor(scores, totalScoreBox, histogram) {
        // IMPORTANT!
        // This function is a gpu.js kernel payload. This imposes considerable restrictions on the subset
        // of javascript it may contain. However, it means it can be run for every point in the viewport
        // in hyper-parallel, for MASSIVE performance gains. `this` is an object provided by gpu.js

        // Screen x runs in the same direction as cartesian x; screen y is opposite
        // cartesian y
        const score = scores[this.thread.y][this.thread.x];
        const totalScore = totalScoreBox[0];

        this.color(1, .75, .25);

        if (score === this.constants.MAX_ITERATIONS) {
            // These are the points that are actually approximated to be in the mandelbrot set.
            this.color(0, 0, 0);
        } else {
            // The coloring algorithm is the heart of why fractal explorers are pretty. This one is taken
            // from literature I read back in 2015; I don't entirely understand how it was derived, but it's
            // basically more of an artistic statement than a mathematical utility. It makes
            // sure complex mathematical structure maps to nice gradients of color without worrying too much
            // about what the mathematical structure means.

            let hue1 = 0.0;
            let hue2 = 0.0;
            for (let n = 0; n < score; n++) {
                if (histogram[n] > 0) {
                    hue1 = hue2;
                    hue2 += histogram[n] / totalScore;
                }
            }

            // This mapping and then interpolation step would both be factored out, with RGBA quads as arrays,
            // in normal JS; but it has to be factored in to stop gpu.js from choking on the array data types
            // getting passed around.
            let R1 = 0;
            let G1 = 0;
            let B1 = 0;
            if (hue1 < this.constants.INTENSITY_CUTOFF) {
                B1 = this.constants.MAX_COLOR_VALUE * hue1;
            } else {
                R1 = this.constants.MAX_COLOR_VALUE
                    * (hue1 - this.constants.INTENSITY_CUTOFF)
                    * this.constants.HIGH_INTENSITY_WEIGHT;
            }

            let R2 = 0;
            let G2 = 0;
            let B2 = 0;
            if (hue2 < this.constants.INTENSITY_CUTOFF) {
                B2 = this.constants.MAX_COLOR_VALUE * hue2;
            } else {
                R2 = this.constants.MAX_COLOR_VALUE
                    * (hue2 - this.constants.INTENSITY_CUTOFF)
                    * this.constants.HIGH_INTENSITY_WEIGHT;
            }

            const proportion = score % 1;

            // gpu.js builtin for outputting directly to the same canvas that's being used to accelerate
            // this whole deal, basically making the whole function an intensive shader.
            this.color(
                R1 * (1-proportion) + R2 * proportion,
                G1 * (1-proportion) + G2 * proportion,
                B1 * (1-proportion) + B2 * proportion
            );
        }
    }

    function outputKernelFactory(gpuWorker) {
        return gpuWorker.createKernel(scoreToColor,
            {
                'loopMaxIterations': math.MAX_ITERATIONS,
                'constants': {
                    'MAX_ITERATIONS': math.MAX_ITERATIONS,
                    'MAX_COLOR_VALUE': MAX_COLOR_VALUE,
                    'INTENSITY_CUTOFF': INTENSITY_CUTOFF,
                    'HIGH_INTENSITY_WEIGHT': HIGH_INTENSITY_WEIGHT
                },
                'pipeline': true
            })
            .setGraphical(true);
    }

    return {
        'PIXEL_RATIO': PIXEL_RATIO,
        'getMouseCoord': getMouseCoord,
        'outputKernelFactory': outputKernelFactory
    };

});