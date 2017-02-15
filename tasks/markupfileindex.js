/*
* grunt-nts-uit-index
* https://github.com/chosungmin/grunt-markupfileindex
*
* Copyright (c) 2016 chosungmin
* Licensed under the MIT license.
*/

'use strict';

module.exports = function(grunt) {
    var isWindows = process.platform === 'win32',
    path = require('path'),
    _ = require('lodash');

    grunt.registerMultiTask('markupfileindex', 'Markup File Index', function() {
        var self = this,
        done = this.async(),
        options = this.options({
            show_date: this.show_date || false,
            filename: this.filename || '@index.html',
            title: this.title || '마크업 산출물',
            include_folder: this.include_folder || ['!$%^!@#$%'],
            file_sort: this.file_sort || 'asc',
            file_sort_key: this.file_sort_key || 'title',
            group_sort: this.group_sort || 'asc',
            path_replace: this.path_replace || null
        }),
        defaultGroupName = ['etc', 'includes'],
        outputGroupName = ['기타', 'Include Files'],
        saveFileList = [],
        checkDestFolder = null;

        // 최종 파일은 파일리스트에서 제외
        this.data.files[0].src.push(this.data.files[0].dest + options.filename);

        grunt.log.writeln("\n*Markup File Index 작성중*");

        this.files.forEach(function(filePair) {
            filePair.src.forEach(function(src) {
                var dest = unixifyPath(filePair.dest);
                src = unixifyPath(src);

                checkDestFolder = grunt.file.arePathsEquivalent(filePair.orig.dest, filePair.orig.cwd)

                if(checkDestFolder){
                    if(!src.match(/^\.\//)) src = './' + src;
                    if(!filePair.orig.dest.match(/\/$/)) filePair.orig.dest = filePair.orig.dest + '/';

                    dest = src.replace(filePair.orig.dest, '');
                }else{
                    dest = '../' + src;
                }

                if(options.path_replace !== null){
                    var reg_exp_str = options.path_replace.split(','),
                    new_reg_exp = null,
                    replace_str = '';

                    if(reg_exp_str.length > 1){
                        new_reg_exp = new RegExp(reg_exp_str[0]);
                        replace_str = reg_exp_str[1];
                    }else{
                        new_reg_exp = new RegExp(reg_exp_str);
                        replace_str = '';
                    }

                    dest = dest.replace(new_reg_exp, replace_str);
                }

                if(grunt.file.isDir(src) !== true && !grunt.file.arePathsEquivalent(path.join(filePair.orig.cwd, options.filename), src)){
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

            filename = (filename.length) ? filename[filename.length-1] : filename ;
            fileContent = grunt.file.read(src);

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
            destFilePath = path.join(unixifyPath(self.data.files[0].dest), options.filename),
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

            if(!!!html[0]) html[0] = '';
            if(!!!html[1]) html[1] = '';

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
                var obj = _.groupBy(obj, key);

                obj = sortObjectByKey(obj, orderBy);

                return obj;
            }

            function sortObjectByKey(obj, orderBy){
                if(orderBy === 'desc'){
                    return Object.keys(obj).sort().reverse().reduce(function (result, key) {
                        result[key] = obj[key];
                        return result;
                    }, {});
                }else{
                    return Object.keys(obj).sort().reduce(function (result, key) {
                        result[key] = obj[key];
                        return result;
                    }, {});
                }
            };

            // 그룹 > 파일 리스트 정렬
            function sortFileList(obj, key, orderBy){
                if(key !== 'title' && key !== 'filename') return obj;

                obj = obj.sort(function(a, b){
                    try{
                        var nameA = a[key].toLowerCase(),
                            nameB = b[key].toLowerCase();

                        if ( key === 'title' && nameA === nameB ) {
                            nameA = a['filename'].toLowerCase(),
                            nameB = b['filename'].toLowerCase();
                        }

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
