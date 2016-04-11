/*
 * grunt-nts-uit-index
 * http://gitlab2.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
 *
 * Copyright (c) 2014 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uit_index: {
      options: {
        show_date : true,
        // filename: '',
        title:'테스트 마크업 산출물',
        // exclusions: [],
        include_folder : ['includes', 'inc', 'testInc', 'aaaatestIncludes'],
        file_sort : 'asc',
        file_sort_key : 'title',
        group_sort : 'asc'
      },
      index: {
        expand : true,
        cwd : './test/',
        src: ['**/*', '!**/node_modules/**/', '!**/.*/**'],
        dest: 'test/'
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
  grunt.registerTask('default', ['uit_index']);
  grunt.registerTask('dist', ['shell:dist', 'copy:dist', 'copy:old', 'clean']);
};
