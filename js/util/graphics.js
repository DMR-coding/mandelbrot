define(['underscore', 'util/math'], function(_, math) {
    const RGBA_LENGTH = 4;

    // The mandelbrot set has extremely (infinitely...) fine detail and aliasing sticks out like a sore thumb,
    // so even though it's slow, we render multiple points per pixel.
    const PIXEL_RATIO = 2;

    const MAX_COLOR_VALUE = 255;
    const OPAQUE = 255; // Really identical to MAX_COLOR_VALUE but more informative at the end of an RGBA quad
    const BLACK = [0, 0, 0, OPAQUE];

    const INTENSITY_CUTOFF = 0.85;

    // imageData is a linear byte array of RGBA values
    function setPixelData(imageData, index, rgba) {
        // Multiply to convert from logical index (n RGBA quads into the array) to physical (n bytes in)
        index *= RGBA_LENGTH;
        for (let i = 0; i < rgba.length; i++) {
            imageData.data[index + i] = rgba[i];
        }
    }

    function interpolateColor(rgba1, rgba2, proportion) {
        const rgba3 = Array(RGBA_LENGTH);
        for (let i = 0; i < RGBA_LENGTH; i++) {
            rgba3[i] = (rgba1[i] * (1 - proportion)) + (rgba2[i] * proportion);
        }
        return rgba3;
    }

    function getMouseCoord(e, element) {
        const rect = element.getBoundingClientRect();
        return [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)];
    }


    function scoreToColor(score, histogram, totalScore) {
        if (score === math.MAX_ITERATIONS) {
            // These are the points that are actually approximated to be in the mandelbrot set.
            return BLACK;
        } else {
            // The coloring algorithm is the heart of why fractal explorers are pretty. This one is taken
            // from literature I read back in 2015; I don't entirely understand how it was derived, but it's
            // basically more of an artistic statement than a mathematical utility. It makes
            // sure complex mathematical structure maps to nice gradients of color without worrying too much
            // about what the mathematical structure means.

            let hue1 = 0.0;
            let hue2 = 0.0;
            for (let n = 0; n < score; n++) {
                if (histogram[n] != null) {
                    hue1 = hue2;
                    hue2 += histogram[n] / totalScore;
                }
            }

            const color1 = mapColor(hue1);
            const color2 = mapColor(hue2);

            return interpolateColor(color1, color2, score % 1);
        }
    }

    // Map the first x% of the intensity spectrum to blue of equal intensity;
    // map the remaining percent to red with roughly the same gamut (so, amplifying the structure of
    // high-scoring regions.)
    function mapColor(intensity) {
        if (intensity < INTENSITY_CUTOFF) {
            return [0, 0, MAX_COLOR_VALUE * intensity, OPAQUE];
        } else {
            const weight = 1 / (1 - INTENSITY_CUTOFF);
            return [MAX_COLOR_VALUE * (intensity - INTENSITY_CUTOFF) * weight, 0, 0, OPAQUE];
        }
    }

    return {
        'PIXEL_RATIO': PIXEL_RATIO,
        'scoreToColor': scoreToColor,
        'setPixelData': setPixelData,
        'interpolateColor': interpolateColor,
        'getMouseCoord': getMouseCoord,
        'mapColor': mapColor
    };

});