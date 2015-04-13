/*
 * grunt-nts-uit-index
 * http://gitlab.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
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
          group_sort: this.group_sort || 'asc'
        }),
        file_ext = /\.+(php|html|htm)$/gi,
        folder_name = /css|img|im/i,
        index_list = [[],[]],
        index_group_name = ['기타', '공통'],
        file_group_txt = ['기타', '공통'],
        file_list = {'기타' : [], '공통' : []},
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
      if(chardet.detectFileSync(abspath) === 'EUC-KR'){
        var file_content = grunt.file.read(abspath, {encoding: 'euc-kr'});
      }else{
        var file_content = grunt.file.read(abspath);
      }
      
      var get_title = '',
          file_group = '';

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
        file_group = index_group_name[0];
      }

      //파일 그룹 추가
      // if(file_group !== '' && index_group_name.indexOf(file_group) === -1){
      //   index_group_name.push(file_group);
      //   index_list.push(new Array());
      // }

      if(file_group !== '' && file_group_txt.indexOf(file_group) === -1){
        file_group_txt.push(file_group);
        file_list[file_group] = [];
      }

      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || find(abspath, subdir, options.include_folder) === true){
        // if(get_title !== null) index_list[1].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
        // else index_list[1].push(abspath + '_$$_' + filename +'_$$_' + abspath);
        
        if(get_title !== null) file_list[file_group_txt[1]].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
        else file_list[file_group_txt[1]].push(abspath + '_$$_' + filename +'_$$_' + abspath)

      }else if(get_title !== null){
        // index_list[index_group_name.indexOf(file_group)].push(abspath + '_$$_' + get_title +'_$$_' + abspath);

        file_list[file_group].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
      }else{
        // index_list[0].push(abspath + '_$$_' + filename +'_$$_' + abspath);

        file_list[file_group_txt[0]].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
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
        // if(key.match(new RegExp(array[i], 'gi')) !== null) return true;
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
          title = '';

      //공통 파일 그룹 없을때 배열 삭제
      if(index_list[1].length === 0){
        index_group_name.splice(1, 1);
        index_list.splice(1, 1);
      }

      // index_group_name.reverse();
      // index_list.reverse();
      // index_group_name.sort();

      file_list = sortObj(file_list, 'key');

      //다운로드 폴더 리스트 처리
      if(options.download === true){
        download += '\t\t<ul>\r\n';
        for(var folder in folder_download){
          if(folder_download[folder] === '#') download += '\t\t<li><a href="">전체</a></li>\r\n';
          else download += '\t\t<li><a href="' + folder_download[folder] + '">' + folder_download[folder] + '</a></li>\r\n';
        }
        download += '\t\t</ul>\r\n';
      }

      //파일 인덱스 리스트 처리
      // for(var group in index_group_name){
      //   if(index_group_name.length > 1) html += '\r\n\t\t<h2 class="sec_h">' + index_group_name[group] + '</h2>\r\n';
      //   else html += '\r\n\t\t<h2 class="sec_h">파일 리스트</h2>\r\n';

      //   html += '\t\t<ul>\r\n';

      //   for(var lst in index_list[group]){
      //     get_con = index_list[group][lst].split('_$$_');
      //     html += '\t\t<li><a href="' + get_con[0] + '">'+ get_con[1] + '<span> / ' + get_con[2] + '</span></a></li>\r\n';
      //   }

      //   html += '\t\t</ul>\r\n';
      // }

      for(var group in file_list){
        if(group === file_group_txt[0] || group === file_group_txt[1]) continue;

        if(file_list[group].length > 1) html += '\r\n\t\t<h2 class="sec_h">' + group + '</h2>\r\n';
        else html += '\r\n\t\t<h2 class="sec_h">파일 리스트</h2>\r\n';

        if(options.file_sort === 'desc'){
          file_list[group] = file_list[group].reverse();
        }

        html += '\t\t<ul>\r\n';

        for(var lst in file_list[group]){

          // console.log('list : ' +  group + ' : ' + lst);

          get_con = file_list[group][lst].split('_$$_');
          html += '\t\t<li><a href="' + get_con[0] + '">'+ get_con[1] + '<span> / ' + get_con[2] + '</span></a></li>\r\n';
        }

        html += '\t\t</ul>\r\n';
      }

      
      for(var i=1; i>=0; i--){
        if(file_list[file_group_txt[i]].length > 1){
          html += '\r\n\t\t<h2 class="sec_h">' + file_group_txt[i] + '</h2>\r\n';
          html += '\t\t<ul>\r\n';

          if(options.file_sort === 'desc'){
            file_list[file_group_txt[i]] = file_list[file_group_txt[i]].reverse();
          }

          for(var lst in file_list[file_group_txt[i]]){

            get_con = file_list[file_group_txt[i]][lst].split('_$$_');
            html += '\t\t<li><a href="' + get_con[0] + '">'+ get_con[1] + '<span> / ' + get_con[2] + '</span></a></li>\r\n';
          }

          html += '\t\t</ul>\r\n';
        }
      }

      // if(file_list[file_group_txt[0]].length > 1){
      //   html += '\r\n\t\t<h2 class="sec_h">' + file_group_txt[0] + '</h2>\r\n';
      //   html += '\t\t<ul>\r\n';

      //   if(options.file_sort == 'desc'){
      //     file_list[file_group_txt[0]] = file_list[file_group_txt[0]].reverse();
      //   }

      //   for(var lst in file_list[file_group_txt[0]]){

      //     get_con = file_list[file_group_txt[0]][lst].split('_$$_');
      //     html += '\t\t<li><a href="' + get_con[0] + '">'+ get_con[1] + '<span> / ' + get_con[2] + '</span></a></li>\r\n';
      //   }

      //   html += '\t\t</ul>\r\n';
      // }
      
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

    function sortObj(obj, type, caseSensitive) {
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

        if(options.group_sort === 'desc'){
          temp_array.reverse();
        }
      }
      var temp_obj = {};
      for (var i=0; i<temp_array.length; i++) {
        temp_obj[temp_array[i]] = obj[temp_array[i]];
      }
      return temp_obj;
    };

  });
};
