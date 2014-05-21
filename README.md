# grunt-nts-uit-index

> grunt nts uit index

## Getting Started
This plugin requires Grunt `~0.4.4`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install http://gitlab.uit.nhncorp.com/grunt-plugins/grunt-nts-uit-index/raw/master/grunt-nts-uit-index-0.1.0.tgz --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-nts-uit-index');
```

## 파일 처리 안내

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
파일명에 _incl, incl_, _inc, inc_ 가 들어가 있다면 공통 파일 그룹으로 처리

## The "uit_index" task

### Overview
In your project's Gruntfile, add a section named `uit_index` to the data object passed into `grunt.initConfig()`.

#### Short
```js
grunt.initConfig({
  uit_index: {
      index: {
        options: {
          src: 'src/'
        }
      }
    }
});
```

#### Medium (specific targets with filename)
```js
grunt.initConfig({
  uit_index: {
      index: {
        options: {
          src: './src/',
          filename: '@index.html',
          exclusions: ['**/@index.html']
        }
      }
    }
});
```

### Options

#### options.src
Type: `String`
Default value: `''`

파일 리스트 작성에 필요한 파일이 있는 폴더 지정

#### options.filename
Type: `String`
Default value: `'@index.html'`

options.src 폴더에 저장할 인덱스 파일명 지정 
지정하지 않을시 '@index.html' 파일 생성

#### options.exclusions
Type: `Array`
Default value: `[]`

제외할 폴더 및 파일을 [minimatch](https://github.com/isaacs/minimatch) 형식으로 입력  
예)['\*.php', '\*\*/tmp/\*', '@\*.\*']

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
0.1.0 : 베타 릴리즈
