require ["test", "test2", "templates", "i18n!strings/nls/main", "jquery", "underscore", "backbone"], 
		(test, test2, templates, strings, $, _, Backbone) ->
    test.exec()
    test2.exec()
    $("body").html templates.render "test"
