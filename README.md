HTML5 Mandelbrot Explorer
=============
A simple web application to explore the Mandelbrot set (without browser plugins!)

Click to zoom in.
Shift-Click to zoom out.

Technologies
------------
* Automation by Grunt -- http://gruntjs.com
* Logic in coffeescript -- http://coffeescript.org
* Styling in SASS (using the indented syntax) -- http://sass-lang.com

Libraries
---------
* Code modularization by requirejs -- http://requirejs.org
* Utility functions by underscore -- http://underscorejs.org
* DOM manipulation by jQuery -- http://jquery.com

Getting Started
---------------
__Note: You may need to elevate privileges to run all "gem" and "npm" commands, e.g. prefix them as 'sudo gem' and 'sudo npm'__

1. Install Ruby (per your system's package management standards)
2. Install Sass:  gem install sass
3. Install NodeJS (per your system's package management standards)
4. Install the Grunt command line interface:  npm install --global grunt-cli
5. Clone this repository and enter its directory.
6. Install package dependencies:  npm install
7. To build:  grunt
8. To automatically build as files are changed:  grunt watch
