define(['jquery', 'underscore', 'util/math', 'util/graphics'], function($, _, math, graphics) {
  const INIT_MAX_X = 1;
  const INIT_MIN_X = -2;
  const INIT_MAX_Y = 1.3;
  const INIT_MIN_Y = -1.3;

  const ZOOM_INCREMENT = 0.5;

  class MandelbrotRender {
    constructor($canvas) {
      this.onClick = this.onClick.bind(this);
      this.$canvas = $canvas;
      this.$canvas.on("click", this.onClick);

      this.canvas = this.$canvas[0];
      this.context = this.canvas.getContext("2d");

      this.max_x = INIT_MAX_X;
      this.max_y = INIT_MAX_Y;
      this.min_x = INIT_MIN_X;
      this.min_y = INIT_MIN_Y;

      this.render();
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

      this.context.font = "48px 'Helvetica Neue', 'Helvetica', 'Arial', Sans-Serif";
      this.context.fillStyle = "orange";
      this.context.fillText("Working...", 50, 50);

      return _.defer(this.renderFrame.bind(this));
    }

    renderFrame() {
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
          if (histogram[i]) { totalScore += histogram[i]; }
        }

        // Here's where we take each score, translate it into a color value, and actually write it onto the
        // scratch.
        for (let i = 0; i < scores.length; i++) {
          graphics.setPixelData(frame, i, this.scoreToColor(scores[i], histogram, totalScore))
        }

        // And here's where we actually write the scratch to the canvas.
        return this.context.putImageData(frame, 0, 0);
    }

    scoreToColor(score, histogram, totalScore) {
          if (score === math.MAX_ITERATIONS) {
            return graphics.BLACK;
          } else {
            let hue1 = 0.0;
            let hue2 = 0.0;
            for (let n = 0; n < score; n++) {
              if (histogram[n] != null) {
                hue1 = hue2;
                hue2 += histogram[n] / totalScore;
              }
            }

            const color1 = graphics.mapColor(hue1);
            const color2 = graphics.mapColor(hue2);

            return graphics.interpolateColor(color1, color2, score % 1);
          }
    }

    // This is where the actual heavy math for generating a particular view of the Mandelbrot Set is actually
    // performed. All else is pretty-printing.
    generateView(width, height) {
        const histogram = new Array(math.MAX_ITERATIONS);
        const scores = new Array(width * height - 1);

        for (let x = 0, end = width, asc = 0 <= end; asc ? x < end : x > end; asc ? x++ : x--) {
          for (let y = 0, end1 = height, asc1 = 0 <= end1; asc1 ? y < end1 : y > end1; asc1 ? y++ : y--) {
            const point = this.pixelToPoint([x,y]);

            let score = math.scoreDivergence(point);
            scores[x + (y * width)] = score;
            score = Math.floor(score);
            if (histogram[score] != null) { histogram[score] += 1; } else { histogram[score] = 1; }
          }
        }

        return [histogram, scores];
    }

    //scale+transform each physical pixel to a logical point in the viewport
    pixelToPoint(pixel) {
      let [width, height] = this.getViewportSize();

      let x = pixel[0];
      x *= width / this.canvas.width;
      x += this.min_x;

      let y = pixel[1];
      y *= height / this.canvas.height;
      y += this.min_y;

      return [x, y];
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
