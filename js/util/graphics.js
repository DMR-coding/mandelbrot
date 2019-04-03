define(['underscore', 'util/math'], function(_, math) {
    'use strict';
    const RGBA_LENGTH = 4;
    const PIXEL_RATIO = 2;

    const MAX_COLOR_VALUE = 255;
    const OPAQUE = 255; // Really identical to MAX_COLOR_VALUE but more informative at the end of an RGBA quad
    const BLACK = [0, 0, 0, OPAQUE];

    // imageData is a linear byte array of RGBA values
    function setPixelData(imageData, index, rgba) {
        index *= RGBA_LENGTH; // Convert from logical index (n RGBA quads into the array) to physical (n bytes in)
        for (let i = 0; i < rgba.length; i++) {
            imageData.data[index + i] = rgba[i];
        }
    }

    function interpolateColor(rgba1, rgba2, proportion) {
        const rgba3 = [];
        for (let i = 0; i < RGBA_LENGTH; i++) {
            rgba3[i] = (rgba1[i] * (1 - proportion)) + (rgba2[i] * proportion);
        }
        return rgba3;
    }

    function getMouseCoord(e, element) {
        const rect = element.getBoundingClientRect();
        return [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)];
    }

    function mapColor(intensity) {
        const cutoff = .85;
        if (intensity < cutoff) {
            return [0, 0, MAX_COLOR_VALUE * intensity, OPAQUE];
        } else {
            return [MAX_COLOR_VALUE * (intensity - cutoff) * (1 / (1 - cutoff)), 0, 0, OPAQUE];
        }
    }

    function scoreToColor(score, histogram, totalScore)
    {
        if (score === math.MAX_ITERATIONS) {
            return BLACK;
        } else {
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


    return {
        'PIXEL_RATIO': PIXEL_RATIO,
        'setPixelData': setPixelData,
        'getMouseCoord': getMouseCoord,
        'scoreToColor': scoreToColor
    };

});