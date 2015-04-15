/*
 * grunt-nts-uit-index
 * http://gitlab2.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
 *
 * Copyright (c) 2014 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

var chardet = require('chardet');

module.exports = function(grunt) {
  grunt.registerMultiTask('uit_index', 'grunt nts uit index', function() {
    var done = this.async(),
        path = require('path'),
        options = this.options({
          src: this.src || null,
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
        file_group_name = ['기타', 'includes'],
        file_list = {'기타' : [], 'includes' : []},
        folder_download = ['#'],
        tmp = null;

    options.exclusions.push('**/' + options.filename);
    options.exclusions.push('**/node_modules/**/*');
    options.exclusions.push('**/node_modules/**/.*');
    options.exclusions.push('**/.*/**/*');
    options.exclusions.push('**/.*/**/.*');

    grunt.file.recurse(options.src, function(abspath, rootdir, subdir, filename){
      //다운로드 폴더 추가(최상위 폴더만...)
      if(!grunt.file.isMatch({matchBase: true}, options.exclusions, abspath)){
        tmp = ('/'+subdir).split('/');
        if(grunt.file.isDir(rootdir+subdir) && tmp[1].match(folder_name) !== null && folder_download.indexOf(tmp[1]) === -1) folder_download.push(tmp[1]);
      }

      //파일 인덱스 리스트 추가
      if(filename.match(file_ext) !== null && !grunt.file.isMatch({matchBase: true}, options.exclusions, abspath)){
        get_title_func(abspath, subdir, filename);
      }      
    });
    output_file_func();

    //title 값 가져오기
    function get_title_func(abspath, subdir, filename){
      var get_title = '',
          file_group = '',
          file_content = null;

      if(chardet.detectFileSync(abspath) === 'EUC-KR'){
        file_content = grunt.file.read(abspath, {encoding: 'euc-kr'});
      }else{
        file_content = grunt.file.read(abspath);
      }
      
      abspath = (subdir !== undefined) ? subdir + '/' + filename : filename ;

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
      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || find(abspath, subdir, options.include_folder) === true){       
        if(get_title !== null){
          file_list[file_group_name[1]].push({
            'abspath': abspath,
            'title': get_title,
            'filename': filename
          });
        }else{
          file_list[file_group_name[1]].push({
            'abspath': abspath,
            'title': filename,
            'filename': filename
          });
        }
      }else if(get_title !== null){
        file_list[file_group].push({
          'abspath': abspath,
          'title': get_title,
          'filename': filename
        });
      }else{
        file_list[file_group_name[0]].push({
          'abspath': abspath,
          'title': get_title,
          'filename': filename
        });
      }
    }

    // array str match
    function find(abspath, subdir, array) {
      subdir = subdir+'/';
      var folder = subdir.split('/');
      for(var i=0; i<array.length; i++){
        for(var j=0; j<folder.length; j++){
          if(folder[i] === array[i]){
            return true;
          }
        }
      }

      return false;
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

      //다운로드 폴더 리스트 처리
      if(options.download === true){
        download += '\t\t<ul>\r\n';
        for(var folder in folder_download){
          if(folder_download[folder] === '#') download += '\t\t<li><a href="">전체</a></li>\r\n';
          else download += '\t\t<li><a href="' + folder_download[folder] + '">' + folder_download[folder] + '</a></li>\r\n';
        }
        download += '\t\t</ul>\r\n';
      }

      // 파일 그룹 정렬
      file_list = sortGroup(file_list, 'key', options.group_sort);

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
      
      dest = path.join(options.src, options.filename);

      if(options.show_date === true){
          creation_date = '<span>(생성일 : ' + d.getFullYear() + '년 ' + parseInt(d.getMonth()+1) + '월 ' + d.getDate() + '일 ' + d.getHours() + '시 ' + d.getMinutes() + '분' +')</span>';
      }
      
      if(options.download === false){
        tpl = tpl.replace(/<script(\s.*){1,17}/, '').replace(/<div id="download">(\s.*){1,4}/,'[[download]]');
      }

      if(options.qrcode === false){
        tpl = tpl.replace(/<h2(\s.*){1,5}/, '');
      }

      grunt.file.write(dest, tpl.replace('[[download]]', download).replace('[[html]]', html).replace(/\[\[title\]\]/g, options.title).replace('[[date]]', creation_date));
      console.log(dest + ' 파일 인덱스 생성 완료');

      done();
    }

    // 그룹 정렬
    function sortGroup(obj, type, sort_type, caseSensitive) {
      var temp_array = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (!caseSensitive) {
            key = (key['toLowerCase'] ? key.toLowerCase() : key);
          }
          temp_array.push(key);
        }
      }
      if (typeof type === 'function') {
        temp_array.sort(type);
      } else if (type === 'value') {
        temp_array.sort(function(a,b) {
          var x = obj[a];
          var y = obj[b];
          if (!caseSensitive) {
            x = (x['toLowerCase'] ? x.toLowerCase() : x);
            y = (y['toLowerCase'] ? y.toLowerCase() : y);
          }
          return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
      } else {
        temp_array.sort();

        if(sort_type === 'desc') temp_array.reverse();
      }

      var temp_obj = {};
      for (var i=0; i<temp_array.length; i++) {
        temp_obj[temp_array[i]] = obj[temp_array[i]];
      }
      return temp_obj;
    };

    // 그룹 > 파일 리스트 정렬
    function sortList(obj, key, sort_type){
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

      if(sort_type === 'desc') return obj.reverse();
      else return obj;
    }
  });
};
