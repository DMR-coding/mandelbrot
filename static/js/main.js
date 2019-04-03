requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: 'lib/jquery',
        underscore: 'lib/underscore'
    }
});


require(['mandelbrot', 'jquery'],
    function(mandelbrot, jQuery) {
        const $canvas = jQuery('<canvas />');

        jQuery(document.body).append($canvas);

        return new mandelbrot.MandelbrotRender($canvas);
    });
