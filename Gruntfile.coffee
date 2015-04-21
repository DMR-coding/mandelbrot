module.exports = (grunt)->
    grunt.initConfig
        pkg: grunt.file.readJSON "package.json"
        clean: ["build"]
        copy: 
            debug:
                files: [
                    expand: true
                    cwd: "static"
                    src: "**"
                    dest: "build/debug/"
                ]
        sass:
            debug:
                options:
                    style: "nested"
                    debugInfo: true
                    lineNumbers: true
                files:
                    #Because of how CSS works, the order in which sass files are
                    #imported is very important. Hence, we only grunt one
                    #top-level sass file, and let it @import the rest so that
                    #their order can be strictly determined.
                    "build/debug/css/page.css":"sass/page.sass"
        coffee:
            debug:
                options:
                    sourceMap: true
                files: [
                    expand: true
                    cwd: "coffee"
                    src: "**/*.coffee"
                    dest: "build/debug/js/" 
                    ext: ".js"
                ]
        hogan:
            debug:
                options:
                    amdWrapper: true
                    amdRequire: 
                        "hogan-2.0.0.min.amd": "Hogan"
                    defaultName: (filename) ->
                        #Strip out everything but the bare filename
                        return filename.match(/.*\/(.*)\.hogan/)[1]
                files: 
                    "build/debug/js/templates_base.js":"hogan/**/*.hogan"
        yuidoc:
            debug:
                name: '<%= pkg.name %>',
                description: '<%= pkg.description %>'
                version: '<%= pkg.version %>'
                url: '<%= pkg.homepage %>'
                options:
                    paths: 'build/debug/js'
                    outdir: 'docs'
        watch:
            static:
                files: ["static/**/*"]
                tasks: ["copy:debug"]
            sass:
                files: ["sass/**/*"]
                tasks: ["sass:debug"]
            coffee:
                files: ["coffee/**/*"]
                tasks: ["coffee:debug", "yuidoc:debug"]
            hogan:
                files: ["hogan/**/*"]
                tasks: ["hogan:debug"]

    #Technologies
    grunt.loadNpmTasks "grunt-contrib-sass"
    grunt.loadNpmTasks "grunt-contrib-coffee"
    grunt.loadNpmTasks "grunt-contrib-hogan"
    grunt.loadNpmTasks "grunt-contrib-yuidoc"

    #Grunt utilities.
    grunt.loadNpmTasks "grunt-contrib-copy"
    grunt.loadNpmTasks "grunt-contrib-watch"
    grunt.loadNpmTasks "grunt-contrib-clean"

    grunt.registerTask "debug", ["clean","copy:debug", "sass:debug",
        "coffee:debug", "hogan:debug", "yuidoc:debug"]
    grunt.registerTask "default", "debug"
