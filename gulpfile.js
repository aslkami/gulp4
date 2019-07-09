const { series, parallel, watch, src, dest } = require('gulp')
const connect = require("gulp-connect")
const Reproxy = require("gulp-connect-reproxy")
const htmlmin = require('gulp-htmlmin')   // 压缩 html
const cleanCSS = require("gulp-clean-css")  // 压缩 css
// const cleanDest = require("gulp-clean-dest") // watch 的时候清除 dist目录
const cleanDest = require("gulp-clean") // 清除 dist目录
const uglify = require("gulp-uglify") // 压缩js
const pipeline = require("readable-stream").pipeline // https://github.com/nodejs/readable-stream
const babel = require("gulp-babel")  // es67 -> es5
const imagemin = require("gulp-imagemin") // 图片处理
const gulpIf = require('gulp-if') // 流程控制
const postcss = require("gulp-postcss") // 处理 css 的包
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const normalize = require("postcss-normalize")
const gulpStyl = require('gulp-stylus')
const changedInPlace = require("gulp-changed-in-place")  // 对比源文件，有变动则输出 dist
const gzip = require("gulp-gzip")
const rename = require('gulp-rename')

const entry = './src'
const outputDir = './dist'
const baseDir = {
  html: "./src/views/**/*.html",
  css: "./src/assets/css/**/*.css",
  styl: "./src/assets/stylus/**/*.styl",
  js: "./src/assets/js/**/*.js",
  img: "./src/assets/img/**/*"
}
const stylOutputDir = outputDir + '/assets/css'

const ENV = 'development'
const isPro = ENV === "production" ? true : false

// 处理 css
const css = () => {
  const plugins = [
    // cssnano(),
    // autoprefixer({ browsers: ["last 2 versions"] }),  // 用这个会加前缀， 但是会有警告
    autoprefixer(),   // 这个无效加不了前缀
    /* normalize({
      browsers: "last 2 versions",
      forceImport: true
    }) */
  ]
  return src([baseDir.styl, baseDir.css], { sourcemaps: true })
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(gulpStyl())
    .pipe(postcss(plugins))
    .pipe(cleanCSS())
    .pipe(dest(stylOutputDir))
    .pipe(connect.reload())
}

// 处理 js
const js = () => {
  return pipeline(
    src(baseDir.js, { base: entry, sourcemaps: true }),
    changedInPlace({ firstPass: true }),
    babel({ presets: ["@babel/preset-env"] }),
    uglify(),
    // gzip(),
    // rename({ extname: '.gzjs' }),
    dest(outputDir)
  ).pipe(connect.reload())
}

// 处理图片
const image = () => {
  const options = {
    optimizationLevel: 5, //类型：Number 默认：3 取值范围：0-7（优化等级）
    progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
    interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
    multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
  }
  return src(baseDir.img, { base: entry, sourcemaps: true })
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(gulpIf(isPro, imagemin(options)))
    .pipe(dest(outputDir))
    .pipe(connect.reload())
}

// 处理 html
const html = () => {
  const options = {
    removeComments: true, //清除HTML注释
    collapseWhitespace: true, //压缩HTML
    collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
    removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
    removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  }
  return src(baseDir.html, { base: entry })
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(htmlmin(options))
    .pipe(dest(outputDir))
    .pipe(connect.reload())
}

// 清除 dist 目录
const cleanDist = () => {
  // allowEmpty 如果没有找到目录会报错，设置为 true 则不管不匹配 dist 目录，继续清除
  return src(outputDir, { read: false, allowEmpty: true }).pipe(cleanDest(outputDir))
}

// 开启服务
const server = () => {
  connect.serverClose()
  return new Promise((resolve, reject) => {
    connect.server({
      root: "dist",
      port: 3000,
      livereload: true,
      debug: true,
      middleware: (connect, options) => {
        options.rule = [/\.do/, /\.jsp/, /\.htm/] //or options.rule = /\.do/;
        options.server = "127.0.0.1:8081"
        let proxy = new Reproxy(options)
        return [proxy]
      }
    })
    resolve()
  })
}

// 监听文件变化
const listen = () => {
  return new Promise((resolve, reject) => {
    watch([baseDir.html], html)
    watch([baseDir.js], js)
    watch([baseDir.css], css)
    watch([baseDir.styl], css)
    watch([baseDir.img], image)
    resolve()
  })
}


exports.default = series(cleanDist, parallel(html, js, image, css), parallel(server, listen))
exports.build = series(cleanDist, parallel(html, js, image, css))