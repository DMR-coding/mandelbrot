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

    function scoreDivergenceKernelFactory(canvas) {
        let gpuWorker;

        // Only use the main view canvas as our acceleration context if we're outputting to it graphically
        // for debugging purposes. If we're actually passing values back, reusing it will fill it with
        // garbage pixels and mess up the output.
        if(DEBUG) {
            gpuWorker = new GPU({'canvas': canvas});
        } else {
            gpuWorker = new GPU();

        }
        return gpuWorker.createKernel(scoreDivergence,
            {
                'constants': {
                    'MAX_ITERATIONS': MAX_ITERATIONS,
                    'DEBUG': DEBUG ? 1 : 0
                }
            }
        ).setGraphical(DEBUG);
    }


    return {
        'MAX_ITERATIONS': MAX_ITERATIONS,
        // 'scoreDivergence': scoreDivergence,
        'scoreDivergenceKernelFactory': scoreDivergenceKernelFactory
    };
});