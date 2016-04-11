/*
 * grunt-nts-uit-index
 * http://gitlab2.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index
 *
 * Copyright (c) 2014 chosungmin
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var isWindows = process.platform === 'win32',
      chardet = require('chardet'),
      _ = require('lodash');

  grunt.registerMultiTask('markupindex', 'Markup File Index', function() {
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
        defaultGroupName = ['etc', 'includes'],
        outputGroupName = ['기타', 'Include Files'],
        saveFileList = [],
        checkDestFolder = grunt.file.arePathsEquivalent(this.data.dest, this.data.cwd);

    // 최종 파일은 파일리스트에서 제외
    this.data.src.push(this.data.dest + options.filename);

    this.files.forEach(function(filePair) {
      filePair.src.forEach(function(src) {
        var dest = unixifyPath(filePair.dest);
        src = unixifyPath(src);

        if(checkDestFolder){
          dest = src.replace(self.data.dest, '');
        }else{
          dest = '../' + src;
        }

        if(grunt.file.isDir(src) !== true && !grunt.file.arePathsEquivalent(path.join(self.data.cwd, options.filename), src)){
          getTitle(src, dest);
        }
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
      var title = '',
          fileGroup = '',
          fileContent = null,
          filename = src.split('/'),
          checkIncludeFolder = new RegExp('\/?' + (options.include_folder.toString()).replace(/,/g, '|') + '\/', 'g');

      filename = (filename.length) ? filename[filename.length-1] : filename;

      if(chardet.detectFileSync(src) === 'EUC-KR'){
        fileContent = grunt.file.read(src, {encoding: 'euc-kr'});
      }else{
        fileContent = grunt.file.read(src);
      }

      //html 문법에서 title값 찾기
      title = fileContent.match(/<title>.*<\/title>/gi);

      if(title !== null){
        title = title[0].replace(/[<|<\/]+title>/gi,'');

        //html title 값이 php 문법일때
        if(title.match(/<\?.*\$pageTitle.*\?>/gi)) title = filename;
      }else{
        //php 문법에서 title값 찾기
        title = fileContent.match(/<\?.*\$pageTitle=[\'|\"].*[\'|\"].*\?>/gi);

        if(title !== null){
          title = title[0].replace(/<\?.*\$pageTitle=[\'|\"]|[\'|\"].*\?>/gi, '');
        }else{
          title = filename;
        }
      }

      //파일 그룹 처리
      if(filename.match(/_incl|incl_|_inc|inc_/g) !== null || src.match(checkIncludeFolder) !== null){
        fileGroup = defaultGroupName[1];
      }else if(title !== null && title.match(/\[.*\]/) !== null){
        fileGroup = (title.match(/\[.*\]/))[0].replace(/\[|\]/g,'');
        title = title.replace(/\[.*\]/,'');
      }else{
        fileGroup = defaultGroupName[0];
      }

      saveFileList.push({
        'group': fileGroup,
        'abspath': dest,
        'title': title,
        'filename': filename
      });
    }

    //인덱스 파일 생성
    function output(self){
      var tpl = grunt.file.read(__dirname + '/../tpl/tpl.html'),
          destFilePath = path.join(unixifyPath(self.data.dest), options.filename),
          date = new Date(),
          html = [],
          saveTarget = 0,
          creationDate = '',
          title = '';

      // 파일 그룹 정렬
      saveFileList = groupBy(saveFileList, 'group', options.group_sort);

      // 그룹별 출력
      for(var group in saveFileList){
        if(group === defaultGroupName[0]){
          saveTarget = 0;
          title = outputGroupName[0]
        }else if(group === defaultGroupName[1]){
          saveTarget = 0;
          title = outputGroupName[1];
        }else{
          saveTarget = 1;
          title = group;
        }

        if(!!!html[saveTarget]) html[saveTarget] = '';

        html[saveTarget] += '\r\n\t\t<h2 class="sec_h">' + title + '</h2>\r\n';

        // 파일 리스트 정렬
        saveFileList[group] = sortFileList(saveFileList[group], options.file_sort_key, options.file_sort);

        html[saveTarget] += '\t\t<ul>\r\n';

        for(var lst in saveFileList[group]){
          html[saveTarget] += '\t\t<li><a href="' + saveFileList[group][lst].abspath + '">'+ saveFileList[group][lst].title + '<span> / ' + saveFileList[group][lst].abspath + '</span></a></li>\r\n';
        }

        html[saveTarget] += '\t\t</ul>\r\n';
      }

      html = html[1].concat(html[0]);

      if(options.show_date){
          creationDate = '<span>(생성일 : ' + date.getFullYear() + '년 ' + parseInt(date.getMonth()+1) + '월 ' + date.getDate() + '일 ' + date.getHours() + '시 ' + date.getMinutes() + '분' +')</span>';
      }

      grunt.file.write(
        destFilePath,
        tpl.replace('[[html]]', html).replace(/\[\[title\]\]/g,
        options.title).replace('[[date]]', creationDate)
      );

      grunt.log.ok(destFilePath + ' 파일 인덱스 생성 완료');

      done();
    }

    // 그룹 정렬
    function groupBy(obj, key, orderBy) {
      return _.groupBy(obj, key);
    }

    // 그룹 > 파일 리스트 정렬
    function sortFileList(obj, key, orderBy){
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
