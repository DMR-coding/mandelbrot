define(['jquery', 'underscore', 'util/math', 'util/graphics'], function($, _, math, graphics) {
    'use strict';
    const ZOOM_INCREMENT = 0.5;

    // This algo is so intensive it freezes the DOM on browser with worse thread isolation (*cough*Fx*cough).
    // So we give a few millis for the loading throbber to actually get rendered before we start hammering
    // things
    const RENDERING_DELAY = 50;

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

            setTimeout(this.renderFrame.bind(this), RENDERING_DELAY);
        }

        renderFrame() {
            this.viewportWidth = Math.abs(this.max_x - this.min_x);
            this.viewportHeight = Math.abs(this.max_y - this.min_y);

            // This is a scratch that we can write image data to. It won't be rendered until we actually
            // do `putImageData` below.
            const frame = this.context.createImageData(this.canvas.width, this.canvas.height);

            // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is
            // performed. All else is pretty-printing.
            const [histogram, scores] = this.generateView(frame.width, frame.height);

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

            // Here's where we take each score, translate it into a color value, and actually write it onto the
            // scratch.
            for (let i = 0; i < scores.length; i++) {
                graphics.setPixelData(frame, i, graphics.scoreToColor(scores[i], histogram, totalScore));
            }

            // And here's where we actually write the scratch to the canvas.
            this.context.putImageData(frame, 0, 0);

            $(this).trigger('rendered');
        }

        // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is actually
        // performed. All else is pretty-printing.
        generateView(width, height) {
            const histogram = new Array(math.MAX_ITERATIONS);
            const scores = new Array(width * height - 1);

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const point = this.pixelToPoint([x, y]);

                    let score = math.scoreDivergence(point);
                    scores[x + (y * width)] = score;
                    score = Math.floor(score);
                    if (histogram[score] != null) {
                        histogram[score] += 1;
                    } else {
                        histogram[score] = 1;
                    }
                }
            }

            return [histogram, scores];
        }

        //scale+transform each physical pixel to a logical point in the viewport
        pixelToPoint(pixel) {
            return [
                pixel[0] * (this.viewportWidth / this.canvas.width) + this.min_x,
                pixel[1] * (this.viewportHeight / this.canvas.height) + this.min_x
            ];
        }

        //Scale the logical viewport by a constant amount and center it on the
        //provided pixel.
        zoom(pixel, out) {
            const [x, y] = this.pixelToPoint(pixel);
            let width = this.viewportWidth;
            let height = this.viewportHeight;

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
