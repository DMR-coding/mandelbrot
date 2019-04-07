define(['jquery', 'underscore', 'util/math', 'util/graphics'], function($, _, math, graphics) {
    const ZOOM_INCREMENT = .5;

    // Utility function that sets a new performance mark and measures from a previous one in the same call,
    // with guarding against performance API not available.
    function trace(mark_to_set, measure_name, mark_to_measure_from) {
        if (window.performance) {
            if (mark_to_set) {
                performance.mark(mark_to_set);
            }

            if (measure_name && mark_to_measure_from) {
                performance.measure(measure_name, mark_to_measure_from);
            }
        }
    }

    class MandelbrotRender {
        constructor($canvas) {
            this.onClick = this.onClick.bind(this);
            this.$canvas = $canvas;
            this.$canvas.on('click', this.onClick);

            this.canvas = this.$canvas[0];

            this.outputKernel = graphics.outputKernelFactory(this.canvas);
            this.scoreDivergenceKernel = math.scoreDivergenceKernelFactory(this.canvas);


            this.left_x = -1;
            this.right_x = 1;

            this.top_y = 1;
            this.bottom_y = -1;
        }

        onClick(e) {
            e.preventDefault();
            this.zoom(graphics.getMouseCoord(e, this.canvas), e.shiftKey);
            this.render()
        }

        render() {
            const width = graphics.PIXEL_RATIO * window.innerWidth;
            const height = graphics.PIXEL_RATIO * window.innerHeight;
            if ((this.canvas.height !== height) || (this.canvas.width !== width)) {
                this.canvas.width = graphics.PIXEL_RATIO * window.innerWidth;
                this.canvas.height = graphics.PIXEL_RATIO * window.innerHeight;
            }

            $(this).trigger('rendering');

            this.renderFrame.bind(this)();
        }

        async renderFrame() {
            trace('begin_render');
            trace('begin_generate_view', 'create_image_data', 'begin_render');

            // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is
            // performed. All else is pretty-printing.
            const [histogram, scores, totalScore] = await this.generateView();

            trace('begin_plotting', 'generate_view', 'begin_generate_view');

            this.outputKernel.setOutput([scores[0].length, scores.length]);
            this.outputKernel(scores, totalScore, histogram);

            trace(null, 'plot', 'begin_plotting');

            $(this).trigger('rendered');
            if (window.performance && window.console) {
                console.log(performance.getEntriesByType('measure'));
                performance.clearMarks();
                performance.clearMeasures();
            }
        }

        // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is actually
        // performed. All else is pretty-printing.
        async generateView() {
            const histogram = new Array(math.MAX_ITERATIONS);
            // Histogram must be dense or gpu.js will choke on the nulls when it's trying to determine
            // dimensionality.
            histogram.fill(0);

            // Determine the scaling factor between each physical pixel and the logical x,y point
            // it represents
            const x_scale = Math.abs(this.right_x - this.left_x) / this.canvas.width;
            const y_scale = Math.abs(this.bottom_y - this.top_y) / this.canvas.height;

            console.log(y_scale, this.top_y, this.bottom_y);

            // The scoreDivergenceKernel does all the heavy work of generating a mandelbrot set in
            // hyper-parallel by abusing the canvas interface to achieve GPU acceleration.
            this.scoreDivergenceKernel.setOutput([this.canvas.width, this.canvas.height]);
            const scores = this.scoreDivergenceKernel(x_scale, y_scale, this.left_x,this.bottom_y);

            for (let column of scores){
                for (let score of column) {
                    score = Math.floor(score);
                    if (histogram[score] != null) {
                        histogram[score] += 1;
                    } else {
                        histogram[score] = 1;
                    }
                }
            }

            // "(divergence) score" is a mathy thing in the mandelbrot algorithm I don't really understand. What's
            // important here is that we're determining how much of it we have in frame total, so that each
            // individual pixel can get a color value based on how it scores relative to the whole view. (That
            // relative score is what makes mandelbrot visualizations pretty!)
            let totalScore = 0;
            for (let i = 0; i < math.MAX_ITERATIONS; i++) {
                if (histogram[i]) {
                    totalScore += histogram[i];
                }
            }

            return [histogram, scores, totalScore];
        }

        //scale+transform each physical pixel to a logical point in the viewport
        pixelToPoint(pixel) {
          let [width, height] = this.getViewportSize();

          let x = pixel[0];
          x *= width / this.canvas.width;
          x += this.left_x;

          let y = pixel[1];
          y *= height / this.canvas.height;
          y -= Math.abs(this.top_y);
          y *= -1;

          return [x, y];
        }

        getViewportSize() {
            return [Math.abs(this.right_x - this.left_x), Math.abs(this.bottom_y - this.top_y)];
        }

        //Scale the logical viewport by a constant amount and center it on the
        //provided pixel.
        zoom(pixel, out) {
            console.log({
                'top': this.top_y,
                'bottom': this.bottom_y,
                'height': Math.abs(this.bottom_y - this.top_y)
            });
            const [x, y] = this.pixelToPoint(pixel);

            console.log("Centering on " + [x, y]);

            let [width, height] = this.getViewportSize();

            if (out) {
                width *= 1 / ZOOM_INCREMENT;
                height *= 1 / ZOOM_INCREMENT;
            } else {
                width *= ZOOM_INCREMENT;
                height *= ZOOM_INCREMENT;
            }
            this.left_x = x - (width / 2);
            this.right_x = x + (width / 2);

            this.top_y = y + (height / 2);
            this.bottom_y = y - (height / 2);

            console.log({
                'top': this.top_y,
                'bottom': this.bottom_y,
                'height': Math.abs(this.bottom_y - this.top_y)
            })
        }
    }

    return {
        MandelbrotRender
    };
});
