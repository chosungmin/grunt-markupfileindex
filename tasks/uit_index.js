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
    var done = this.async(),
        path = require('path'),
        options = this.options({
          // src: this.src || null,
          show_date: this.show_date || false,
          filename: this.filename || '@index.html',
          title: this.title || '마크업 산출물',
          exclusions: this.exclusions || [],
          include_folder: this.include_folder || [],
          qrcode: this.qrcode || true,
          download: this.download || true,
          file_sort: this.file_sort || 'asc',
          file_sort_key: this.file_sort_key || 'title',
          group_sort: this.group_sort || 'asc'
        }),
        file_ext = /\.+(php|html|htm)$/gi,
        folder_name = /css|img|im/i,
        file_group_name = ['etc', 'includes'],
        // file_list = {'기타' : [], 'includes' : []},
        file_list = [],
        folder_download = ['#'],
        tmp = null;

    options.exclusions.push('**/' + options.filename);
    options.exclusions.push('**/node_modules/**/*');
    options.exclusions.push('**/node_modules/**/.*');
    options.exclusions.push('**/.*/**/*');
    options.exclusions.push('**/.*/**/.*');

    var detectDestType = function(dest) {
      if (grunt.util._.endsWith(dest, '/')) {
        return 'directory';
      } else {
        return 'file';
      }
    };

    var unixifyPath = function(filepath) {
      if (isWindows) {
        return filepath.replace(/\\/g, '/');
      } else {
        return filepath;
      }
    };

    var isExpandedPair;
    this.files.forEach(function(filePair) {
      isExpandedPair = filePair.orig.expand || false;

      // console.log(filePair);

      filePair.src.forEach(function(src) {
        src = unixifyPath(src);
        var dest = unixifyPath(filePair.dest);

        if (detectDestType(dest) === 'directory') {
          dest = isExpandedPair ? dest : path.join(dest, src);
        }

        if(grunt.file.isDir(src) !== true) get_title_func(src, dest);
      });
    });

    output_file_func();

    //title 값 가져오기
    function get_title_func(src, dest){
      var get_title = '',
          file_group = '',
          file_content = null,
          filename = src.split('/'),
          filename = filename[filename.length-1],
          include_folder = new RegExp('\/?' + (options.include_folder.toString()).replace(/,/g, '|') + '\/', 'g');

      // console.log(src, src.match(include_folder), include_folder);
      // src.match(include_folder);

      // return;

      if(chardet.detectFileSync(src) === 'EUC-KR'){
        file_content = grunt.file.read(src, {encoding: 'euc-kr'});
      }else{
        file_content = grunt.file.read(src);
      }

      // abspath = (subdir !== undefined) ? subdir + '/' + filename : filename ;

      //html 문법에서 title값 찾기
      get_title = file_content.match(/<title>.*<\/title>/gi);

      if(get_title !== null){
        get_title = get_title[0].replace(/[<|<\/]+title>/gi,'');

        //html title 값이 php 문법일때
        if(get_title.match(/<\?.*\$pageTitle.*\?>/gi)) get_title = filename;
      }else{
        //php 문법에서 title값 찾기
        get_title = file_content.match(/<\?.*\$pageTitle=[\'|"].*[\'|”].*\?>/gi);

        if(get_title !== null){
          get_title = get_title[0].replace(/<\?.*\$pageTitle=[\'|"]|[\'|”].*\?>/gi, '');
        }
      }

      //파일 그룹 처리
      if(get_title !== null && get_title.match(/\[.*\]/) !== null){
        file_group = get_title.match(/\[.*\]/);
        file_group = file_group[0].replace(/\[|\]/g,'');
        get_title = get_title.replace(/\[.*\]/,'');
      }else{
        file_group = file_group_name[0];
      }

      // 새로운 파일 그룹일때 그룹 추가 및 배열 초기화
      if(file_group !== '' && file_group_name.indexOf(file_group) === -1){
        file_group_name.push(file_group);
        file_list[file_group] = [];
      }

      // 파일 정보 저장
      // if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || find(abspath, subdir, options.include_folder) === true){
      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || src.match(include_folder) !== null){
        if(get_title !== null){
            file_list.push({
              'group': file_group_name[1],
              'abspath': dest,
              'title': get_title,
              'filename': filename
            });
          }else{
            file_list.push({
              'group': file_group_name[1],
              'abspath': dest,
              'title': filename,
              'filename': filename
            });
          }
        }else if(get_title !== null){
          file_list.push({
            'group': file_group,
            'abspath': dest,
            'title': get_title,
            'filename': filename
          });
        }else{
          file_list.push({
            'group': file_group_name[0],
            'abspath': dest,
            'title': get_title,
            'filename': filename
          });
        }
    }

    //인덱스 파일 생성
    function output_file_func(){
      var tpl = grunt.file.read(__dirname + '/../tpl/tpl.html'),
          html = '',
          download = '',
          get_con = '',
          dest = '',
          d = new Date(),
          creation_date = '',
          title = '',
          group_num = 0;

      // console.log(file_list);

      // 파일 그룹 정렬
      file_list = sortGroup(file_list, 'group', options.group_sort);


      // 그룹별 출력
      for(var group in file_list){
        // 기타, Include 그룹 제외하고 출력
        if(group === file_group_name[0] || group === file_group_name[1]) continue;

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
        if(file_list[file_group_name[i]].length >= 1){

          if(i === 0 && group_num === 0 && file_list[file_group_name[1]].length === 0){
            html += '\r\n\t\t<h2 class="sec_h">파일 리스트</h2>\r\n';
          }else{
            html += '\r\n\t\t<h2 class="sec_h">' + file_group_name[i].replace(/^includes$/, 'Include files') + '</h2>\r\n';
          }

          html += '\t\t<ul>\r\n';

          // 파일 리스트 정렬
          file_list[file_group_name[i]] = sortList(file_list[file_group_name[i]], options.file_sort_key, options.file_sort);

          for(var lst in file_list[file_group_name[i]]){
            html += '\t\t<li><a href="' + file_list[file_group_name[i]][lst].abspath + '">'+ file_list[file_group_name[i]][lst].title + '<span> / ' + file_list[file_group_name[i]][lst].abspath + '</span></a></li>\r\n';
          }

          html += '\t\t</ul>\r\n';
        }
      }

      var dest = unixifyPath(this.files.dest);

      if (detectDestType(dest) === 'directory') {
        dest = path.join(dest, options.filename);
      }

      // dest = path.join(options.dest, options.filename);

      if(options.show_date === true){
          creation_date = '<span>(생성일 : ' + d.getFullYear() + '년 ' + parseInt(d.getMonth()+1) + '월 ' + d.getDate() + '일 ' + d.getHours() + '시 ' + d.getMinutes() + '분' +')</span>';
      }
        console.log(dest);
      grunt.file.write(dest, tpl.replace('[[html]]', html).replace(/\[\[title\]\]/g, options.title).replace('[[date]]', creation_date));
      grunt.log.ok(dest + ' 파일 인덱스 생성 완료');

      done();
    }

    // 그룹 정렬
    function sortGroup(obj, key, orderBy) {
      var groups = _.groupBy( obj, key );

      // for ( var key in groups ){
      //   groups[key].sort( function(a,b){ var x = a.abspath, y = b.abspath; return x === y ? 0 : x < y ? -1 : 1; } );
      // }


      // Object.keys(groups).reverse();

      console.log( groups );
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
      else return obj;
    }
  });
};
