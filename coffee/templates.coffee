###*
A wrapper for our Hogan templates which provides a few extra amenities.
Assumes the actual templates live in module "templates_base."
@class templates
@static
###
define ["templates_base", "i18n!strings/nls/main"], (templates_base, strings) ->
    ###*
    Render a template. Automatically appends the strings object to its context
    for minimal-hassle internationalization.
    @method render
    @static
    @param {String} name The name of the template to be rendered.
    @param {Object} [context] The object to passed to the template as
     rendering context.
    @param {Object} [partials] A dictionary of partials for use by the
     template.
    @return {String} The rendered template.
    ###
    render: (name, context, partials) ->
        templates_base[name].render(
            _.extend strings: strings, context
            partials
        )
    ###*
    Gets a reference to a raw template.
    @method get
    @param {String} name The name of the template.
    @return {Hogan.template} The template.
    ###
    get: (name) ->
        templates_base[name]
