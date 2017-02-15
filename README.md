# grunt-markupfileindex

> grunt nts uit index

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-markupfileindex --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-markupfileindex');
```

### 타이틀을 가져오는 HTML, PHP 코드 안내
```html
<title>[그룹명] 타이틀명</title>
<title>타이틀명</title>
```
&lt;title&gt; 값을 읽어 옴

```php
<?php $pageTitle='[그룹명] 타이틀명';include '00_header_incl.php'; ?>
<?php $pageTitle='타이틀명';include '00_header_incl.php'; ?>
```
&lt;? $pageTitle = '...' ?&gt; 해당되는 텍스트 값을 가져옴

html, php title이 없거나 패턴에 맞지 않을 경우 파일명으로 출력

### 공통 그룹 처리 안내
파일명에 \_incl, incl\_, \_inc, inc\_ 가 들어가 있다면 공통 파일 그룹으로 처리
옵션 항목 중 'include_folder' 항목을 지정

## The "markupfileindex" task

### Overview
In your project's Gruntfile, add a section named `markupfileindex` to the data object passed into `grunt.initConfig()`.

#### 기본 옵션 설정
```js
grunt.initConfig({
  markupfileindex: {
    index: {
      files: [{
        expand : true,
        cwd : 'test/',
        src: ['**/*.{html,php}', '!**/node_modules/**', '!**/.*/**'],
        dest: 'test/'
      }]
    }
  }
});
```

#### 확장 옵션 설정
```js
grunt.initConfig({
  markupfileindex: {
    options: {
      show_date : true,
      filename: '@test.html',
      title:'테스트 마크업 산출물',
      include_folder : ['includes', 'inc', 'testInc'],
      file_sort : 'asc',
      file_sort_key : 'title',
      group_sort : 'asc',
      path_replace : '^../',
    },

    index: {
      files: [{
        expand : true,
        cwd : 'test/',
        src: ['**/*.{html,php}', '!**/node_modules/**', '!**/.*/**'],
        dest: 'test/'
      }]
    }
  }
});
```

### Options

#### options.show_date
Type : `Boolean`
Default value: `false`

인덱스 파일 생성일자 출력 여부 선택

#### options.filename
Type: `String`
Default value: `'@index.html'`

options.src 폴더에 저장할 인덱스 파일명 지정
지정하지 않을시 '@index.html' 파일 생성

#### options.title
Type: `String`
Default value: `'마크업 산출물'`

index 파일 타이틀 지정

#### options.include_folder
Type: `Array`
Default value: `[]`

공통 파일이 들어 있는 폴더 입력
예)['includes', 'inc']

#### options.group_sort
Type: `String`
Default value: `asc`
Value: `asc | desc`

그룹 리스트 정렬(오름차순, 내림차순 중 선택)

#### options.file_sort
Type: `String`
Default value: `asc`
Value: `asc | desc`

파일 리스트 정렬(오름차순, 내림차순 중 선택)

#### options.file_sort_key
Type: `String`
Default value: `title`
Value: `title | filename`

파일 리스트 정렬 키(제목, 파일명 중 선택 중 선택)

#### options.path_replace
Type: `String`
Default value: ``
Value: `치환 정규표현식, 치환할 값`

주소 치환 정규식 및 치환 값 설정
예) '^../, '../../test'
