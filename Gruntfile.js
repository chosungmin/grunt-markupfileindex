/*
 * grunt-markupfileindex
 * https://github.com/chosungmin/grunt-markupfileindex.git
 *
 * Copyright (c) 2016 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    markupfileindex: {
      options: {
        show_date : true,
        // filename: '@test.html',
        title:'테스트 마크업 산출물',
        include_folder : ['includes', 'inc', 'testInc'],
        file_sort : 'asc',
        file_sort_key : 'title',
        group_sort : 'asc',
        path_replace : '',
      },
      index: {
        files: [{
          expand : true,
          cwd : 'test/',
          src: ['**/*.{html,php}', '!**/node_modules/**', '!**/.*/**'],
          dest: 'test/'
        }]
      }
    },
    shell: {
      dist: {
        command: 'npm pack'
      }
    },
    copy: {
      dist: {
        src: '<%= pkg.name %>-<%= pkg.version %>.tgz',
        dest: 'dist/<%= pkg.name %>.latest.tgz'
      },
      old: {
        expand : true,
        cwd : '',
        src: ['*.tgz'],
        dest: 'dist/old/'
      }
    },
    clean: ['<%= pkg.name %>-<%= pkg.version %>.tgz'],
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['markupfileindex']);
  grunt.registerTask('dist', ['shell:dist', 'copy:dist', 'copy:old', 'clean']);
};
