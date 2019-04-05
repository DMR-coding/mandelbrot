define(['underscore', 'util/math'], function(_, math) {
    const operative = window.operative; // This lib needs to be imported as a script tag for odd scope reasons

    const RGBA_LENGTH = 4;

    // The mandelbrot set has extremely (infinitely...) fine detail and aliasing sticks out like a sore thumb,
    // so even though it's slow, we render multiple points per pixel.
    const PIXEL_RATIO = 2;

    // imageData is a linear byte array of RGBA values
    function setPixelData(imageData, index, rgba) {
        // Multiply to convert from logical index (n RGBA quads into the array) to physical (n bytes in)
        index *= RGBA_LENGTH;
        for (let i = 0; i < rgba.length; i++) {
            imageData.data[index + i] = rgba[i];
        }
    }

    function getMouseCoord(e, element) {
        const rect = element.getBoundingClientRect();
        return [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)];
    }

    // TODO: the point of asynchronizing this method was to parallelize it with operative, but operative is
    // giving an error when used here that I still need to hunt down.
    async function colorize(scores, histogram) {
        // Constants need to be inside this function, even if that duplicate a global constant,
        // so that this function can be self-contained enough for Operative to tear it away
        const RGBA_LENGTH = 4;

        const MAX_COLOR_VALUE = 255;
        const OPAQUE = 255; // Really identical to MAX_COLOR_VALUE but more informative at the end of an RGBA quad
        const BLACK = [0, 0, 0, OPAQUE];

        const INTENSITY_CUTOFF = 0.85;

        const colors = new Array(scores.length);

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

        for(let i = 0; i < scores.length; i++){
            colors[i] = scoreToColor(scores[i])
        }

        return colors;

        function scoreToColor(score) {
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

        function interpolateColor(rgba1, rgba2, proportion) {
            const rgba3 = Array(RGBA_LENGTH);
            for (let i = 0; i < RGBA_LENGTH; i++) {
                rgba3[i] = (rgba1[i] * (1 - proportion)) + (rgba2[i] * proportion);
            }
            return rgba3;
        }
    }


    return {
        'PIXEL_RATIO': PIXEL_RATIO,
        'getMouseCoord': getMouseCoord,
        'colorize': colorize,
        'setPixelData': setPixelData
    };

});