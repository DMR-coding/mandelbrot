define(['underscore'], function(_){
  const RGBA_LENGTH = 4;
  const PIXEL_RATIO = 2;

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

  return {
      'PIXEL_RATIO': PIXEL_RATIO,
      'setPixelData': setPixelData,
      'interpolateColor': interpolateColor,
      'getMouseCoord': getMouseCoord
  }

});