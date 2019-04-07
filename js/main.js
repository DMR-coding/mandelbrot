requirejs.config({
    baseUrl: 'js',
    paths: {
        jquery: 'lib/jquery',
        underscore: 'lib/underscore',
        GPU: 'lib/gpu'
    }
});


require(['mandelbrot', 'jquery'],
    function(mandelbrot, $) {
        const $canvas = $('<canvas />').appendTo('body');
        const $loadingIndicator = $("<div class='loading-indicator'></div>");

        const renderer = new mandelbrot.MandelbrotRender($canvas);

        $(renderer).on('rendering', function(){
            $loadingIndicator.appendTo('body');
        });

        $(renderer).on('rendered', function(){
            $loadingIndicator.remove();
        });

        renderer.render();
    });
