define(['underscore'], function(_) {
    const RGBA_LENGTH = 4;
    const PIXEL_RATIO = 2;

    const MAX_COLOR_VALUE = 255;
    const OPAQUE = 255; // Really identical to MAX_COLOR_VALUE but more informative at the end of an RGBA quad
    const BLACK = [0, 0, 0, OPAQUE];

    // imageData is a linear byte array of RGBA values
    function setPixelData(imageData, index, rgba) {
        index *= RGBA_LENGTH;
        for (let i = 0; i < rgba.length; i++) {
            // Multiply to convert from logical index (n RGBA quads into the array) to physical (n bytes in)
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

    function mapColor(intensity) {
        const cutoff = .85;
        if (intensity < cutoff) {
            return [0, 0, MAX_COLOR_VALUE * intensity, OPAQUE];
        } else {
            intensity -= cutoff;
            const weight = 1 / (1 - cutoff);
            return [MAX_COLOR_VALUE * intensity * weight, 0, 0, OPAQUE];
        }
    }

    return {
        'BLACK': BLACK,
        'PIXEL_RATIO': PIXEL_RATIO,
        'setPixelData': setPixelData,
        'interpolateColor': interpolateColor,
        'getMouseCoord': getMouseCoord,
        'mapColor': mapColor
    };

});