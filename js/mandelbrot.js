define(['jquery', 'underscore', 'util/math', 'util/graphics'], function($, _, math, graphics) {
    const ZOOM_INCREMENT = 0.5;

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
            this.context = this.canvas.getContext('2d');

            this.max_x = 1;
            this.max_y = 1.3;
            this.min_x = -2;
            this.min_y = -1.3;
        }

        onClick(e) {
            e.preventDefault();
            this.zoom(graphics.getMouseCoord(e, this.canvas), e.shiftKey);
            return this.render();
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
            // This is a scratch that we can write image data to. It won't be rendered until we actually
            // do `putImageData` below.
            const frame = this.context.createImageData(this.canvas.width, this.canvas.height);

            trace('begin_generate_view', 'create_image_data', 'begin_render');

            // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is
            // performed. All else is pretty-printing.
            const [histogram, scores] = await this.generateView(frame.width, frame.height);

            trace('begin_totalling_score', 'generate_view', 'begin_generate_view');


            trace('begin_plotting', 'total_score', 'begin_totalling_score');

            // Here's where we take each score, translate it into a color value, and actually write it onto the
            // scratch.
            const colors = await graphics.colorize(scores, histogram);
            for (let i = 0; i < colors.length; i++) {
                graphics.setPixelData(frame, i, colors[i]);
            }
            trace('begin_blitting', 'plot', 'begin_plotting');

            // And here's where we actually write the scratch to the canvas.
            this.context.putImageData(frame, 0, 0);
            trace(null, 'blit', 'begin_blitting');

            $(this).trigger('rendered');
            if (window.performance && window.console) {
                console.log(performance.getEntriesByType('measure'));
                performance.clearMarks();
                performance.clearMeasures();
            }
        }

        // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is actually
        // performed. All else is pretty-printing.
        async generateView(width, height) {
            let scores = new Array(width * height);
            const histogram = new Array(math.MAX_ITERATIONS);

            // This is basically what pixelToPoint does. We duplicate the logic here because this
            // is a tight inner loop, and the overhead turns out to be pretty significant if
            // we actually call that method and its chained dependencies.
            const x_scale = Math.abs(this.max_x - this.min_x) / this.canvas.width;
            const y_scale = Math.abs(this.max_y - this.min_y) / this.canvas.height;

            // TODO: scoreRangeDivergence is in a worker, which at least unfreezes the dom so the spinner can
            // go; but the MAIN point of it was so that we could divvy up the work. However I still need to
            // figure out how to do that so that I don't create so much overhead that it more than cancels
            // the benefit of parallelizing!
            let WORKER_COUNT = 16;

            let ranges = [];
            const range_size = Math.ceil(scores.length / WORKER_COUNT);
            for (let i = 0; i < WORKER_COUNT; i++) {
                let start = i * range_size;
                let end =  Math.min((i + 1) * range_size, width * height);
                ranges.push(
                    math.scoreRangeDivergence(
                        start, end,
                        x_scale, y_scale,
                        this.min_x, this.min_y,
                        width, height
                    )
                );
            }

            ranges = await Promise.all(ranges);

            console.log(scores);
            console.log(ranges);

            // A functional style reduce-by-concat is waaaaaaay inefficient here, at least in Firefox,
            // so let's do this the old fashioned way
            let flattened_index = 0;
            for(let i = 0; i < ranges.length; i++){ // The for-of loop also starts to die at this size
                console.log(ranges[i].length);
                for(let n = 0; n < ranges[i].length; n++){
                    scores[flattened_index] = ranges[i][n];
                    flattened_index++;
                }
            }

            for (let score of scores) {
                score = Math.floor(score);
                if (histogram[score] != null) {
                    histogram[score] += 1;
                } else {
                    histogram[score] = 1;
                }
            }

            return [histogram, scores];
        }

        //scale+transform each physical pixel to a logical point in the viewport
        pixelToPoint(pixel) {
            const [width, height] = this.getViewportSize();
            return [
                pixel[0] * (width / this.canvas.width) + this.min_x,
                pixel[1] * (height / this.canvas.height) + this.min_y
            ];
        }

        getViewportSize() {
            return [Math.abs(this.max_x - this.min_x), Math.abs(this.max_y - this.min_y)];
        }

        //Scale the logical viewport by a constant amount and center it on the
        //provided pixel.
        zoom(pixel, out) {
            const [x, y] = this.pixelToPoint(pixel);
            let [width, height] = this.getViewportSize();

            if (out) {
                width *= 1 / ZOOM_INCREMENT;
                height *= 1 / ZOOM_INCREMENT;
            } else {
                width *= ZOOM_INCREMENT;
                height *= ZOOM_INCREMENT;
            }

            this.min_x = x - (width / 2);
            this.max_x = x + (width / 2);

            this.min_y = y - (height / 2);
            return this.max_y = y + (height / 2);
        }
    }

    return {
        MandelbrotRender
    };
});
