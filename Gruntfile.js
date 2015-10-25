/*global module:false, require:true*/
module.exports = function(grunt) {

  var config = require('./config');

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    concat: {
      options: {
        separator: ''
      },
      js: {
        files: {
          // Third party javascript dependencies used in this website.
          './src/js/dependencies.js' : config.dependencies,
          
          // All custom scripts written for this website.
          './src/js/scripts.js': config.scripts
        }
      }
    },

    uglify: {
      options: {
        mangle: false,
        sourceMap: true,
        compress: {
          drop_console: true
        }
      },
      scripts: {
        files: {
          './build/js/scripts.min.js': [
            './src/js/scripts.js'
          ]
        }
      },
      dependencies: {
        files: {
          './build/js/dependencies.min.js': [
            './src/js/dependencies.js'
          ]
        }
      }
    },
    jshint: {
      options: config.jshint,
      gruntfile: {
        src: 'Gruntfile.js'
      },
      lib_test: {
        src: ['src/js/**/*.js', '!src/js/dependencies.js', '!src/js/scripts.js']
      }
    },
    cssmin: {
      options: {
        sourceMap: true
      },
      target: {
        files: [{
          expand: true,
          cwd: './src/css',
          src: ['*.css', '!*.min.css'],
          dest: './build/css',
          ext: '.min.css'
        }]
      }
    },
    copy: {
      html: {
        nonull: true,
        src: [
          'src/index.html',
        ], 
        dest: 'build/index.html',
        options: {
          process: function (content) {
            return content
              .replace(/\.css/g,'.min.css')
              .replace(/\.js/g, '.min.js')
              .replace(/\[DEV\]\s/, '');
          },
        }
      },
      main: {
        files: [
          {
            nonull: true,
            expand: true, 
            flatten: true, 
            src: [
              'src/robots.txt',
            ], 
            dest: 'build/',
            filter: 'isFile'
          },
          {
            expand: true,
            dest: 'build/models/',
            cwd: 'src/models',
            src: [
              '**'
            ] 
          }
        ],
      },
    },
    watch: {
      gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfile']
      },
      lib_test: {
        files: ['src/js/scripts/app.js', 'src/js/scripts/**/*.js', 'src/js/scripts/**/*.jsx', 'config.js'],
        tasks: ['jshint:lib_test', 'concat']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task to run before deploying.
  grunt.registerTask('default', ['jshint', 'concat', 'uglify', 'cssmin', 'copy']);

};
