require ["mandelbrot", "templates", "i18n!strings/nls/main", "jquery", "underscore", "backbone"],
		(mandelbrot, templates, strings, $, _, Backbone) ->
			width = window.innerWidth
			height = window.innerHeight
			$canvas = $ "<canvas />"

			$(document.body).append($canvas)

			main = new mandelbrot.MandelbrotRender($canvas)
