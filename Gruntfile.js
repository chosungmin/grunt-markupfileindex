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
    pkg: grunt.file.readJSON('package.json'),
    uit_index: {
      index: {
        options: {
          src: './test/',
          show_date : true,
          // filename: '',
          // title:'테스트 마크업 산출물',
          // exclusions: [],
          include_folder : ['includes'],
          qrcode : true,
          download : true
        }
      }
    },
    shell: {
      dist: {
        command: 'npm pack'
      }
    },
    copy: {
      dist: {
        src: 'grunt-nts-uit-index-<%= pkg.version %>.tgz',
        dest: 'dist/grunt-nts-uit-index.latest.tgz'
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['uit_index']);
  grunt.registerTask('dist', ['shell:dist', 'copy:dist']);

};
