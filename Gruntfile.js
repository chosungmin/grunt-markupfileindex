/*
 * grunt-nts-uit-index
 * http://gitlab.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
 *
 * Copyright (c) 2014 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    uit_index: {
      index: {
        options: {
          src: './test/',
          // filename: '',
          // title:'테스트 마크업 산출물',
          // exclusions: []
        }
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['uit_index']);

};
