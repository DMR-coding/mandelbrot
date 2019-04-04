define(['jquery', 'underscore', 'util/math', 'util/graphics'], function($, _, math, graphics) {
  const ZOOM_INCREMENT = 0.5;

  // This algo is so intensive it freezes the DOM on browser with worse thread isolation (*cough*Fx*cough).
  // So we give a few millis for the loading throbber to actually get rendered before we start hammering
  // things
  const RENDERING_DELAY = 50;

  // Utility function that sets a new performance mark and measures from a previous one in the same call,
  // with guarding against performance API not available.
  function trace(mark_to_set, measure_name, mark_to_measure_from) {
    if(window.performance){
      if(mark_to_set) {
        performance.mark(mark_to_set)
      }

      if(measure_name && mark_to_measure_from) {
        performance.measure(measure_name, mark_to_measure_from)
      }
    }
  }

  class MandelbrotRender {
    constructor($canvas) {
      this.onClick = this.onClick.bind(this);
      this.$canvas = $canvas;
      this.$canvas.on("click", this.onClick);

      this.canvas = this.$canvas[0];
      this.context = this.canvas.getContext("2d");

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
        trace('begin_render');
        // This is a scratch that we can write image data to. It won't be rendered until we actually
        // do `putImageData` below.
        const frame = this.context.createImageData(this.canvas.width, this.canvas.height);

        trace('begin_generate_view', 'create_image_data', 'begin_render');

        // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is
        // performed. All else is pretty-printing.
        const [histogram, scores] = this.generateView(frame.width, frame.height);

        trace('begin_totalling_score', 'generate_view', 'begin_generate_view');

        // "(divergence) score" is a mathy thing in the mandelbrot algorithm I don't really understand. What's
        // important here is that we're determining how much of it we have in frame total, so that each
        // individual pixel can get a color value based on how it scores relative to the whole view. (That
        // relative score is what makes mandelbrot visualizations pretty!)
        let totalScore = 0;
        for (let i = 0; i < math.MAX_ITERATIONS; i++) {
          if (histogram[i]) { totalScore += histogram[i]; }
        }
        trace('begin_plotting', 'total_score', 'begin_totalling_score');

        // Here's where we take each score, translate it into a color value, and actually write it onto the
        // scratch.
        for (let i = 0; i < scores.length; i++) {
          graphics.setPixelData(frame, i, graphics.scoreToColor(scores[i], histogram, totalScore))
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
    generateView(width, height) {
        const histogram = new Array(math.MAX_ITERATIONS);
        const scores = new Array(width * height - 1);

        // This is basically what pixelToPoint does. We duplicate the logic here because this
        // is a tight inner loop, and the overhead turns out to be pretty significant if
        // we actually call that method and its chained dependencies.
        const horizontal_factor = Math.abs(this.max_x - this.min_x) / this.canvas.width;
        const vertical_factor = Math.abs(this.max_y - this.min_y) / this.canvas.height;

        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {

            let score = math.scoreDivergence(
             x * horizontal_factor +  this.min_x,
             y * vertical_factor + this.min_y
            );
            scores[x + (y * width)] = score;
            score = Math.floor(score);
            if (histogram[score] != null) { histogram[score] += 1; } else { histogram[score] = 1; }
          }
        }

        return [histogram, scores];
    }

    //scale+transform each physical pixel to a logical point in the viewport
    pixelToPoint(pixel) {
      const [width, height] = this.getViewportSize();
      return [
          pixel[0] * (width / this.canvas.width) +  this.min_x,
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
        width *= 1/ZOOM_INCREMENT;
        height *= 1/ZOOM_INCREMENT;
      } else {
        width *= ZOOM_INCREMENT;
        height *= ZOOM_INCREMENT;
      }

      this.min_x = x - (width/2);
      this.max_x = x + (width/2);

      this.min_y = y - (height/2);
      return this.max_y = y + (height/2);
    }
  }

  return {
    MandelbrotRender
  };
});
