// the GPU lib is supposed to be AMD compatible, but its AMD support is kinda broken.
// Requiring it actually does cause it to be loaded, so don't remove it as a dependency, but it just winds up
// registered as window.GPU
define(['underscore', 'GPU'], function(_, _GPU) {
    const MAX_ITERATIONS = 1000;
    const DEBUG = false;
    
    // The mandelbrot set consists of points in complex space where iteratively applying a certain function to
    // the point's coordinate does not cause the value to approach infinity. However, in an explorer, the
    // *actual* mandelbrot set is the dull region in the middle of all the fun colors-- those are actually
    // points _near_ the set. They are given a score based on how many iterations it takes for them to diverge
    // (approach infinity) which makes for the most interesting visuals.
    function scoreDivergence(x_scale, y_scale, left_x, bottom_y) {
        // IMPORTANT!
        // This function is a gpu.js kernel payload. This imposes considerable restrictions on the subset
        // of javascript it may contain. However, it means it can be run for every point in the viewport
        // in hyper-parallel, for MASSIVE performance gains. `this` is an object provided by gpu.js

        // Screen x runs in the same direction as cartesian x; screen y is opposite
        // cartesian y
        const lx = this.thread.x * x_scale + left_x;
        const ly = this.thread.y * y_scale + bottom_y;

        let x = 0.0;
        let y = 0.0;

        let iteration = 0;

        while ((((x * x) + (y * y)) < 0xF00) && (iteration < this.constants.MAX_ITERATIONS)) {
            const tx = ((x * x) - (y * y)) + lx;
            y = (2 * x * y) + ly;
            x = tx;
            iteration += 1;
        }

        if (iteration < this.constants.MAX_ITERATIONS) {
            const zn = Math.sqrt((x * x) + (y * y));
            const nu = Math.log(Math.log(zn) / Math.log(2)) / Math.log(2);
            iteration = (iteration + 1) - nu;
        }

        if(this.constants.DEBUG === 0){
           return iteration;
        }
        else {
            // Do basic, direct graphical output instead of returning the results for more dramatic
            // visualization. Draws axes and colors the quadrants to help us detect inverted logic.
            if(iteration === this.constants.MAX_ITERATIONS) {
                this.color(0, 0, 0);
            } else {
                if(ly < 0 && lx < 0) {
                    this.color(0, 1, 1);
                }
                if(ly < 0 && lx > 0) {
                    this.color(0, .75, .75);
                }
                if(ly > 0 && lx < 0) {
                    this.color(1, 1, 0);
                }
                if(ly > 0 && lx > 0) {
                    this.color(.75, .75, 0);
                }
            }

            const delta = 0.0004;
            if(Math.abs(lx) < delta ) {
                this.color(0,1,0);
            }
            if(Math.abs(ly) < delta) {
                this.color(1,0,0)
            }
        }
    }

    // This is a silly way to do this calculation. It's very linear and would be far faster on the CPU;
    // but by doing it on the GPU we can avoid marshalling scores into main memory.

    // FIXME: Unfortunately, "algorithmically silly" seems to trump "low overhead" and result in slower performance
    // overall. :(
    function computeHistogram(scores, width, height) {
        let entry = 0;
        for (let i = 0; i < width; i++){
            for (let n = 0; n < height; n++) {
                let score = Math.floor(scores[i][n]);

                if(score === this.thread.x) {
                    entry = entry + 1;
                }
            }
        }

        return entry;
    }

    function totalScore(histogram) {
        // Divergence score is math whose exact definition isn't important here; what matters is that
        // we're determining how much of it we have in frame total, so that each
        // individual pixel can get a color value based on how it scores relative to the whole view rather
        // than absolutely. (That relative score is what makes mandelbrot visualizations pretty!)
        let total = 0;
        for(let i = 0; i < this.constants.MAX_ITERATIONS; i++){
            total = total + histogram[i];
        }
        return total;
    }

    function mathKernelFactory(gpuWorker) {
        let scoringKernel = gpuWorker.createKernel(scoreDivergence,
            {
                'constants': {
                    'MAX_ITERATIONS': MAX_ITERATIONS,
                    'DEBUG': DEBUG ? 1 : 0
                },
                'pipeline': true
            }
        ).setGraphical(DEBUG);

        let histogramKernel = gpuWorker.createKernel(computeHistogram, {
            'pipeline': true
        })
        .setOutput([MAX_ITERATIONS]);

        let totalScoreKernel = gpuWorker.createKernel(totalScore, {
            'pipeline': true,
            'loopMaxIterations': MAX_ITERATIONS,
            'constants': {
                'MAX_ITERATIONS': MAX_ITERATIONS
            }
        })
        .setOutput([1]);

        return [scoringKernel, histogramKernel, totalScoreKernel];
    }

    return {
        'MAX_ITERATIONS': MAX_ITERATIONS,
        // 'scoreDivergence': scoreDivergence,
        'mathKernelFactory': mathKernelFactory
    };
});