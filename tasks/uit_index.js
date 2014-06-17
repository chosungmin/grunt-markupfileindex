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
          exclusions: this.exclusions || []
        }),
        file_ext = /\.+(php|html|htm)$/gi,
        folder_name = /css|img|im/i,
        index_list = [[],[]],
        index_group_name = ['기타', '공통'],
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
      var file_content = grunt.file.read(abspath),
          get_title = '',
          file_group = '',
          org_abspath = abspath;

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
      if(file_group !== '' && index_group_name.indexOf(file_group) === -1){
        index_group_name.push(file_group);
        index_list.push(new Array());
      }

      //문자셋이 EUC-KR일 때 문자 깨짐 현상 임시 처리
      if(chardet.detectFileSync(org_abspath) === 'EUC-KR') get_title = null;

      //공통 그룹 파일 구분 및 일반 파일 추가
      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null){
        if(get_title !== null) index_list[1].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
        else index_list[1].push(abspath + '_$$_' + filename +'_$$_' + abspath);
      }else if(get_title !== null){
        index_list[index_group_name.indexOf(file_group)].push(abspath + '_$$_' + get_title +'_$$_' + abspath);
      }else{
        index_list[0].push(abspath + '_$$_' + filename +'_$$_' + abspath);
      }
    }

    //인덱스 파일 생
    function output_file_func(){
      var tpl = grunt.file.read(__dirname + '/../tpl/tpl.html'),
          html = '',
          download = '',
          get_con = '',
          dest = '',
          d = new Date(),
          creation_date = '';

      //공통 파일 그룹 없을때 배열 삭제
      if(index_list[1].length === 0){
        index_group_name.splice(1, 1);
        index_list.splice(1, 1);
      }

      index_group_name.reverse();
      index_list.reverse();

      //다운로드 폴더 리스트 처리
      download += '\t\t<ul>\r\n';
      for(var folder in folder_download){
        if(folder_download[folder] === '#') download += '\t\t<li><a href="">전체</a></li>\r\n';
        else download += '\t\t<li><a href="' + folder_download[folder] + '">' + folder_download[folder] + '</a></li>\r\n';
      }
      download += '\t\t</ul>\r\n';

      //파일 인덱스 리스트 처리
      for(var group in index_group_name){
        if(index_group_name.length > 1) html += '\r\n\t\t<h2 class="sec_h">' + index_group_name[group] + '</h2>\r\n';
        else html += '\r\n\t\t<h2 class="sec_h">파일 리스트</h2>\r\n';

        html += '\t\t<ul>\r\n';

        for(var lst in index_list[group]){
          get_con = index_list[group][lst].split('_$$_');
          html += '\t\t<li><a href="' + get_con[0] + '">'+ get_con[1] + '<span> / ' + get_con[2] + '</span></a></li>\r\n';
        }

        html += '\t\t</ul>\r\n';
      }
      
      dest = path.join(options.src, options.filename);

      if(options.show_date === true){
          creation_date = '<span>(생성일 : ' + d.getFullYear() + '년 ' + d.getMonth() + '월' + d.getDate() + '일 ' + d.getHours() + '시 ' + d.getMinutes() + '분' +')</span>';
      }
      
      grunt.file.write(dest, tpl.replace('[[download]]', download).replace('[[html]]', html).replace('[[title]]', options.title).replace('[[date]]', creation_date));
      console.log(dest + ' 파일 인덱스 생성 완료');

      done();
    }

  });
};
