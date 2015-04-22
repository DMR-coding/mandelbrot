define ["jquery"], ($) ->
  LOGICAL_WIDTH = 4
  LOGICAL_HEIGHT = 4
  MAX_ITERATIONS = 255

  setPixel = (imageData, x, y, rgba) ->
    index = 4 * (x + y * imageData.width)
    for i in [0 ... rgba.length]
      imageData.data[index + i] = rgba[i]

  #scale+transform each physical pixel to a logical point in cartesian space
  mapPoint = (point, frame) ->
    width_multiplier = LOGICAL_WIDTH / frame.width
    height_multiplier = LOGICAL_HEIGHT / frame.height

    x = point[0]
    x -= frame.width / 2
    x *= width_multiplier

    y = point[1]
    y -= frame.height / 2
    y *= height_multiplier

    return [x, y]

  scoreDivergence = (point) ->
    [lx, ly] = point
    x = 0.0
    y = 0.0

    iteration = 0

    while x*x + y*y < 4 and iteration < MAX_ITERATIONS
      tx = x*x - y*y + lx
      y = 2*x*y + ly
      x = tx
      iteration += 1

    return iteration

  scoreColor = (score) ->
    255 - score

  class MandelbrotRender
    constructor: (@$canvas) ->
      @canvas = @$canvas[0]
      @context = @canvas.getContext("2d")
      @render()

    render: () ->
      @canvas.width = window.innerWidth
      @canvas.height = window.innerHeight
      frame = @context.createImageData(@canvas.width, @canvas.height)
      for x in [0...frame.width]
        for y in [0...frame.height]
          logicalPoint = mapPoint [x,y], frame

          if logicalPoint[0] == 0 or logicalPoint[1] == 0
            setPixel(frame, x, y, [255,0,0, 255])
          else
            score = scoreDivergence logicalPoint
            val = scoreColor score
            setPixel(frame, x, y, [val,val,val, 255])

      @context.putImageData(frame, 0, 0)

  return {
    MandelbrotRender: MandelbrotRender
  }
