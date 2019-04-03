define(['jquery', 'underscore'], function($, _) {
  const INIT_MAX_X = 1;
  const INIT_MIN_X = -2;
  const INIT_MAX_Y = 1.3;
  const INIT_MIN_Y = -1.3;

  const ZOOM_INCREMENT = 0.5;
  const PIXEL_RATIO = 2;

  const MAX_ITERATIONS = 1000;

  const MAX_COLOR_VALUE = 255;

  const getDataIndex = (imageData, x, y) => 4 * (x + (y * imageData.width));

  var setPixelData = function(imageData, index, rgba) {
    for (let i = 0, end = rgba.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      imageData.data[index + i] = rgba[i];
    }
    if (rgba.length < 4) {
      return imageData.data[index + 3] = MAX_COLOR_VALUE;
    }
  };

  const interpolate = function(rgba1, rgba2, proportion) {
    const rgba3 = [];
    for (let i = 0, end = rgba1.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
      rgba3[i] = (rgba1[i] * (1 - proportion)) + (rgba2[i] * proportion);
    }
    return rgba3;
  };

  const scoreDivergence = function(point) {
    const [lx, ly] = Array.from(point);
    let x = 0.0;
    let y = 0.0;

    let iteration = 0;

    while ((((x*x) + (y*y)) < 0xF00) && (iteration < MAX_ITERATIONS)) {
      const tx = ((x*x) - (y*y)) + lx;
      y = (2*x*y) + ly;
      x = tx;
      iteration += 1;
    }

    if (iteration < MAX_ITERATIONS) {
      const zn = Math.sqrt((x*x) + (y*y));
      const nu = Math.log( Math.log(zn) / Math.log(2)) / Math.log(2);
      iteration = (iteration + 1) - nu;
    }

    return iteration;
  };

  const getMouseCoord = function(e, element) {
    const rect = element.getBoundingClientRect();
    return [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)];
  };

  const mapColor = function(intensity) {
    const cutoff = .85;
    if (intensity < cutoff) {
      return [0, 0, MAX_COLOR_VALUE * intensity];
    } else {
      intensity -= cutoff;
      const weight = 1 / (1 - cutoff);
      return [MAX_COLOR_VALUE * intensity * weight, 0, 0];
    }
  };

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
      this.zoom(getMouseCoord(e, this.canvas), e.shiftKey);
      return this.render();
    }

    render() {
      const width = PIXEL_RATIO * window.innerWidth;
      const height = PIXEL_RATIO * window.innerHeight;
      if ((this.canvas.height !== height) || (this.canvas.width !== width)) {
        this.canvas.width = PIXEL_RATIO * window.innerWidth;
        this.canvas.height = PIXEL_RATIO * window.innerHeight;
      }

      this.context.font = "48px 'Helvetica Neue', 'Helvetica', 'Arial', Sans-Serif";
      this.context.fillStyle = "orange";
      this.context.fillText("Working...", 50, 50);

      return _.defer(() => {
        let i, score;
        let asc2, end2;
        let asc3, end3;
        const frame = this.context.createImageData(this.canvas.width, this.canvas.height);

        const histogram = new Array(MAX_ITERATIONS);
        const scores = new Array((this.canvas.width * this.canvas.height) - 1);

        for (let x = 0, end = frame.width, asc = 0 <= end; asc ? x < end : x > end; asc ? x++ : x--) {
          for (let y = 0, end1 = frame.height, asc1 = 0 <= end1; asc1 ? y < end1 : y > end1; asc1 ? y++ : y--) {
            const point = this.pixelToPoint([x,y]);

            score = scoreDivergence(point);
            scores[x + (y * frame.width)] = score;
            score = Math.floor(score);
            if (histogram[score] != null) { histogram[score] += 1; } else { histogram[score] = 1; }
          }
        }

        let totalScore = 0;
        for (i = 0, end2 = MAX_ITERATIONS, asc2 = 0 <= end2; asc2 ? i < end2 : i > end2; asc2 ? i++ : i--) {
          if (histogram[i] != null) { totalScore += histogram[i]; }
        }

        for (i = 0, end3 = scores.length, asc3 = 0 <= end3; asc3 ? i < end3 : i > end3; asc3 ? i++ : i--) {
          score = scores[i];
          if (score === MAX_ITERATIONS) {
            setPixelData(frame, 4 * i, [0, 0, 0, MAX_COLOR_VALUE]);
          } else {
            let hue1 = 0.0;
            let hue2 = 0.0;
            for (let n = 0, end4 = score, asc4 = 0 <= end4; asc4 ? n < end4 : n > end4; asc4 ? n++ : n--) {
              if (histogram[n] != null) {
                hue1 = hue2;
                hue2 += histogram[n] / totalScore;
              }
            }

            const color1 = mapColor(hue1);
            const color2 = mapColor(hue2);

            setPixelData(frame, 4 * i, interpolate(color1, color2, score % 1) );
          }
        }

        return this.context.putImageData(frame, 0, 0);
      });
    }

    //scale+transform each physical pixel to a logical point in the viewport
    pixelToPoint(pixel) {
      let [width, height] = Array.from(this.viewportSize());
      width = Math.abs(this.max_x - this.min_x);
      height = Math.abs(this.max_y - this.min_y);

      let x = pixel[0];
      x *= width / this.canvas.width;
      x += this.min_x;

      let y = pixel[1];
      y *= height / this.canvas.height;
      y += this.min_y;

      return [x, y];
    }

    viewportSize() {
      return [Math.abs(this.max_x - this.min_x), Math.abs(this.max_y - this.min_y)];
    }

    //Scale the logical viewport by a constant amount and center it on the
    //provided pixel.
    zoom(pixel, out) {
      if (out == null) { out = false; }
      const [x, y] = Array.from(this.pixelToPoint(pixel));
      let [width, height] = Array.from(this.viewportSize());

      if (out) {
        width *= 1/ZOOM_INCREMENT;
        height *= 1/ZOOM_INCREMENT;
      } else {
        width *= ZOOM_INCREMENT;
        height *= ZOOM_INCREMENT;
      }

      this.min_x = x - (width/2);
      this.max_x = x + (width/2);

      this.min_y = y - (width/2);
      return this.max_y = y + (width/2);
    }
  }

  return {
    MandelbrotRender
  };
});
