/*
 * grunt-nts-uit-index
 * http://gitlab2.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
 *
 * Copyright (c) 2014 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

var chardet = require('chardet'),
    _ = require('lodash');

module.exports = function(grunt) {
  var isWindows = process.platform === 'win32';

  grunt.registerMultiTask('uit_index', 'grunt nts uit index', function() {
    var self = this,
        done = this.async(),
        path = require('path'),
        options = this.options({
          show_date: this.show_date || false,
          filename: this.filename || '@index.html',
          title: this.title || '마크업 산출물',
          include_folder: this.include_folder || [],
          qrcode: this.qrcode || true,
          download: this.download || true,
          file_sort: this.file_sort || 'asc',
          file_sort_key: this.file_sort_key || 'title',
          group_sort: this.group_sort || 'asc'
        }),
        file_ext = /\.+(php|html|htm)$/gi,
        folder_name = /css|img|im|images/i,
        default_group_name = ['etc', 'includes'],
        output_group_name = ['기타', 'Include Files'],
        file_list = [],
        tmp = null,
        // isExpandedPair,
        check_dest_folder = grunt.file.arePathsEquivalent(this.data.dest, this.data.cwd);

    // 최종 파일은 파일리스트에서 제외
    this.data.src.push(this.data.dest + options.filename);

    this.files.forEach(function(filePair) {
      // isExpandedPair = filePair.orig.expand || false;

      filePair.src.forEach(function(src) {
        var dest = unixifyPath(filePair.dest);
        src = unixifyPath(src);

        if(check_dest_folder){
          dest = src.replace(self.data.dest, '');
        }else{
          dest = '../' + src;
        }

        if(grunt.file.isDir(src) !== true) getTitle(src, dest);
      });
    });

    output(self);

    function detectDestType(dest) {
      if (grunt.util._.endsWith(dest, '/')) {
        return 'directory';
      } else {
        return 'file';
      }
    };

    function unixifyPath(filepath) {
      if (isWindows) {
        return filepath.replace(/\\/g, '/');
      } else {
        return filepath;
      }
    };

    //title 값 가져오기
    function getTitle(src, dest){
      var get_title = '',
          file_group = '',
          file_content = null,
          filename = src.split('/'),
          filename = (filename.length) ? filename[filename.length-1] : filename,
          include_folder = new RegExp('\/?' + (options.include_folder.toString()).replace(/,/g, '|') + '\/', 'g');

      if(chardet.detectFileSync(src) === 'EUC-KR'){
        file_content = grunt.file.read(src, {encoding: 'euc-kr'});
      }else{
        file_content = grunt.file.read(src);
      }

      //html 문법에서 title값 찾기
      get_title = file_content.match(/<title>.*<\/title>/gi);

      if(get_title !== null){
        get_title = get_title[0].replace(/[<|<\/]+title>/gi,'');

        //html title 값이 php 문법일때
        if(get_title.match(/<\?.*\$pageTitle.*\?>/gi)) get_title = filename;
      }else{
        //php 문법에서 title값 찾기
        get_title = file_content.match(/<\?.*\$pageTitle=[\'|\"].*[\'|\"].*\?>/gi);

        if(get_title !== null){
          get_title = get_title[0].replace(/<\?.*\$pageTitle=[\'|\"]|[\'|\"].*\?>/gi, '');
        }else{
          get_title = filename;
        }
      }

      //파일 그룹 처리
      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || src.match(include_folder) !== null){
        file_group = default_group_name[1];
      }else if(get_title !== null && get_title.match(/\[.*\]/) !== null){
        file_group = (get_title.match(/\[.*\]/))[0].replace(/\[|\]/g,'');
        get_title = get_title.replace(/\[.*\]/,'');
      }else{
        file_group = default_group_name[0];
      }

      file_list.push({
        'group': file_group,
        'abspath': dest,
        'title': get_title,
        'filename': filename
      });
    }

    //인덱스 파일 생성
    function output(self){
      var tpl = grunt.file.read(__dirname + '/../tpl/tpl.html'),
          html = '',
          download = '',
          get_con = '',
          dest = '',
          d = new Date(),
          creation_date = '',
          title = '',
          group_num = 0,
          dest_file_path = '';

      // 파일 그룹 정렬
      file_list = groupBy(file_list, 'group', options.group_sort);

      // 그룹별 출력
      for(var group in file_list){
        // 기타, Include 그룹 제외하고 출력
        if(group === default_group_name[0] || group === default_group_name[1]) continue;

        // '기타' -> '파일 리스트' 그룹명 변경을 변수
        group_num++;

        html += '\r\n\t\t<h2 class="sec_h">' + group + '</h2>\r\n';

        // 파일 리스트 정렬
        file_list[group] = sortList(file_list[group], options.file_sort_key, options.file_sort);

        html += '\t\t<ul>\r\n';

        for(var lst in file_list[group]){
          html += '\t\t<li><a href="' + file_list[group][lst].abspath + '">'+ file_list[group][lst].title + '<span> / ' + file_list[group][lst].abspath + '</span></a></li>\r\n';
        }

        html += '\t\t</ul>\r\n';
      }

      // 기타, Include 그룹 출력
      for(var i=0; i<=1; i++){
        if(file_list[default_group_name[i]].length >= 1){

          if(i === 0 && group_num === 0 && file_list[default_group_name[1]].length === 0){
            html += '\r\n\t\t<h2 class="sec_h">파일 리스트</h2>\r\n';
          }else{
            html += '\r\n\t\t<h2 class="sec_h">' + output_group_name[i] + '</h2>\r\n';
          }

          html += '\t\t<ul>\r\n';

          // 파일 리스트 정렬
          file_list[default_group_name[i]] = sortList(file_list[default_group_name[i]], options.file_sort_key, options.file_sort);

          for(var lst in file_list[default_group_name[i]]){
            html += '\t\t<li><a href="' + file_list[default_group_name[i]][lst].abspath + '">'+ file_list[default_group_name[i]][lst].title + '<span> / ' + file_list[default_group_name[i]][lst].abspath + '</span></a></li>\r\n';
          }

          html += '\t\t</ul>\r\n';
        }
      }

      dest_file_path = path.join(unixifyPath(self.data.dest), options.filename);

      if(options.show_date === true){
          creation_date = '<span>(생성일 : ' + d.getFullYear() + '년 ' + parseInt(d.getMonth()+1) + '월 ' + d.getDate() + '일 ' + d.getHours() + '시 ' + d.getMinutes() + '분' +')</span>';
      }

      grunt.file.write(dest_file_path, tpl.replace('[[html]]', html).replace(/\[\[title\]\]/g, options.title).replace('[[date]]', creation_date));
      grunt.log.ok(dest_file_path + ' 파일 인덱스 생성 완료');

      done();
    }

    // 그룹 정렬
    function groupBy(obj, key, orderBy) {
      return _.groupBy(obj, key);
    }

    // 그룹 > 파일 리스트 정렬
    function sortList(obj, key, orderBy){
      if(key !== 'title' && key !== 'filename') return obj;

      obj = obj.sort(function(a, b){
        try{
          var nameA = a[key].toLowerCase(),
              nameB = b[key].toLowerCase();

          if(nameA < nameB) return -1;
          if(nameA > nameB) return 1;
          return 0;
        }catch(e){

        }
      });

      if(orderBy === 'desc') return obj.reverse();

      return obj;
    }
  });
};
