define ["jquery", "underscore"], ($, _) ->
  INIT_MAX_X = 1
  INIT_MIN_X = -2
  INIT_MAX_Y = 1.3
  INIT_MIN_Y = -1.3

  ZOOM_INCREMENT = 0.5
  PIXEL_RATIO = 2

  MAX_ITERATIONS = 1000

  MAX_COLOR_VALUE = 255

  getDataIndex = (imageData, x, y) -> 4 * (x + y * imageData.width)

  setPixel = (imageData, x, y, rgba) ->
    setPixelData(imageData, getDataIndex(imageData, x, y), rgba)

  setPixelData = (imageData, index, rgba) ->
    for i in [0 ... rgba.length]
      imageData.data[index + i] = rgba[i]
    if rgba.length < 4
      imageData.data[index + 3] = MAX_COLOR_VALUE

  getPixel = (imageData, x, y) ->
    index = getDataIndex(imageData, x, y)
    return imageData.data[index ... index + 4]

  interpolate = (rgba1, rgba2, proportion) ->
    rgba3 = []
    for i in [0 ... rgba1.length]
      rgba3[i] = rgba1[i] * (1 - proportion) + rgba2[i] * proportion
    return rgba3

  scoreDivergence = (point) ->
    [lx, ly] = point
    x = 0.0
    y = 0.0

    iteration = 0

    while x*x + y*y < 0xF00 and iteration < MAX_ITERATIONS
      tx = x*x - y*y + lx
      y = 2*x*y + ly
      x = tx
      iteration += 1

    if iteration < MAX_ITERATIONS
      zn = Math.sqrt(x*x + y*y)
      nu = Math.log( Math.log(zn) / Math.log(2)) / Math.log(2)
      iteration = iteration + 1 - nu

    return iteration

  getMouseCoord = (e, element) ->
    rect = element.getBoundingClientRect()
    [PIXEL_RATIO * (e.clientX - rect.left), PIXEL_RATIO * (e.clientY - rect.top)]

  mapColor = (intensity) ->
    cutoff = .85
    if intensity < cutoff
      [0, 0, MAX_COLOR_VALUE * intensity]
    else
      intensity -= cutoff
      weight = 1 / (1 - cutoff)
      [MAX_COLOR_VALUE * intensity * weight, 0, 0]

  class MandelbrotRender
    constructor: (@$canvas) ->
      @$canvas.on("click", @onClick)
      @$canvas.on("mousemove", @onMouseMove)

      @canvas = @$canvas[0]
      @context = @canvas.getContext("2d")

      @max_x = INIT_MAX_X
      @max_y = INIT_MAX_Y
      @min_x = INIT_MIN_X
      @min_y = INIT_MIN_Y

      @render()

    onClick: (e) =>
      @zoom getMouseCoord e, @canvas
      @render()

    onMouseMove: (e) =>
      [x, y] = getMouseCoord e, @canvas
      debug = x + ", " + y + ": " + scoreDivergence(@pixelToPoint([x, y]))
      console.log(debug)

    render: () ->
      width = PIXEL_RATIO * window.innerWidth
      height = PIXEL_RATIO * window.innerHeight
      if @canvas.height != height or @canvas.width != width
        @canvas.width = PIXEL_RATIO * window.innerWidth
        @canvas.height = PIXEL_RATIO * window.innerHeight

      @context.font = "48px 'Helvetica Neue', 'Helvetica', 'Arial', Sans-Serif"
      @context.fillStyle = "orange"
      @context.fillText("Working...", 50, 50)

      _.defer =>
        frame = @context.createImageData(@canvas.width, @canvas.height)

        histogram = new Array(MAX_ITERATIONS)
        scores = new Array(@canvas.width * @canvas.height - 1)

        for x in [0...frame.width]
          for y in [0...frame.height]
            point = @pixelToPoint [x,y]

            score = scoreDivergence point
            scores[x + y * frame.width] = score
            score = Math.floor(score)
            if histogram[score]? then histogram[score] += 1 else histogram[score] = 1

        totalScore = 0
        for i in [0 ... MAX_ITERATIONS]
          if histogram[i]? then totalScore += histogram[i]

        for i in [0 ... scores.length]
          score = scores[i]
          if score == MAX_ITERATIONS
            setPixelData(frame, 4 * i, [0, 0, 0, MAX_COLOR_VALUE])
          else
            hue1 = 0.0
            hue2 = 0.0
            for n in [0 ... score]
              if histogram[n]?
                hue1 = hue2
                hue2 += histogram[n] / totalScore

            color1 = mapColor(hue1)
            color2 = mapColor(hue2)

            setPixelData(frame, 4 * i, interpolate(color1, color2, score % 1) )

        @context.putImageData(frame, 0, 0)

    #scale+transform each physical pixel to a logical point in the viewport
    pixelToPoint: (pixel) ->
      [width, height] = @viewportSize()
      width = Math.abs(@max_x - @min_x)
      height = Math.abs(@max_y - @min_y)

      x = pixel[0]
      x *= width / @canvas.width
      x += @min_x

      y = pixel[1]
      y *= height / @canvas.height
      y += @min_y

      return [x, y]

    viewportSize: () ->
      return [Math.abs(@max_x - @min_x), Math.abs(@max_y - @min_y)]

    #Scale the logical viewport by a constant amount and center it on the
    #provided pixel.
    zoom: (pixel) ->
      [x, y] = @pixelToPoint pixel
      [width, height] = @viewportSize()

      width *= ZOOM_INCREMENT
      height *= ZOOM_INCREMENT

      @min_x = x - width/2
      @max_x = x + width/2

      @min_y = y - width/2
      @max_y = y + width/2

  return {
    MandelbrotRender: MandelbrotRender
  }
