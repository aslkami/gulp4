const { src, dest, watch, series, parallel } = require("gulp")
const clean = require("gulp-clean")
const browserSync = require("browser-sync").create()
const reload = browserSync.reload
const changedInPlace = require("gulp-changed-in-place")
const rename = require("gulp-rename")
const uglify = require("gulp-uglify-es").default
const babel = require("gulp-babel")
const htmlmin = require("gulp-htmlmin")
const sass = require("gulp-sass")
const postcss = require("gulp-postcss")
const sourcemaps = require("gulp-sourcemaps")
const autoprefixer = require("autoprefixer")
var csso = require("gulp-csso")
const minimist = require("minimist")
const GulpSSH = require("gulp-ssh")

// 服务器多了一个admin路径，所以本地开发的时候也添加一个admin路径。不过发版的时候就要上传dist/admin下面的文件了

const BASE_DIR = "dist"
const PUBLIC_PATH = "/admin/"

const ssh = {
  test: {
    host: "172.16.18.1",
    // port: 16689,
    username: "root",
    password: "dev.5566",
    path: "/mnt/ztev-admin/" //放在服务器的路径
  },
  prod: {
    host: "58.42.244.88",
    // port: 16689,
    username: "root",
    password: "root123",
    path: "./ztev-admin/"
  }
}

const knownOptions = {
  string: "env",
  default: { env: process.env.NODE_ENV || "prod" }
}
const options = minimist(process.argv.slice(2), knownOptions)

const buildDir = options.env !== "dev" ? BASE_DIR : BASE_DIR + PUBLIC_PATH

const base = {
  html: "src/**/**.html",
  css: ["src/**/**.css", "src/**/**.scss"],
  js: "src/**/**.js",
  img: "src/**/images/**",
  copy: ["src/**/lib/**", "src/**/fonts/**", "src/**/**.json"]
}

const compilePass = base.copy.map(item => `!${item}`)

/**
 * html文件处理
 */

function html(cb) {
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
  return src([base.html, ...compilePass])
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(htmlmin(options))
    .pipe(dest(buildDir))
    .pipe(reload({ stream: true }))
  cb()
}

/**
 * css文件处理
 */

function css(cb) {
  return src([...base.css, ...compilePass])
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer()]))
    .pipe(csso())
    .pipe(sourcemaps.write("."))
    .pipe(dest(buildDir))
    .pipe(reload({ stream: true }))
  cb()
}

/**
 * js文件处理
 */

function js(cb) {
  return src([base.js, ...compilePass])
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(
      uglify({
        compress: {
          // drop_debugger: false
        }
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(dest(buildDir))
    .pipe(reload({ stream: true }))
  cb()
}

/**
 * img文件处理
 */

function img(cb) {
  return src([base.img, ...compilePass])
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(dest(buildDir))
    .pipe(reload({ stream: true }))
  cb()
}

/**
 * 需要copy目录下文件处理
 */

function copy(cb) {
  return src(base.copy)
    .pipe(changedInPlace({ firstPass: true }))
    .pipe(dest(buildDir))
    .pipe(reload({ stream: true }))
  cb()
}

/**
 * 清除dist目录
 */
function cleanDist(cb) {
  return src(BASE_DIR, { read: false, allowEmpty: true }).pipe(clean())
  cb()
}
/**
 * 启动服务
 */
function server(cb) {
  browserSync.init({
    server: { baseDir: BASE_DIR },
    port: 8002,
    startPath: PUBLIC_PATH + "login.html",
    ghostMode: false, //联动
    notify: false, // 头部标签
    open: false
  })
  watch(base.html, html)
  watch(base.css, css)
  watch(base.js, js)
  watch(base.img, img)
  watch(base.copy, copy)
  cb()
}

function sftp(cb) {
  // gulpSSH.shell(['cd /mnt/ztev-admin', 'rm -rf *'], {filePath: 'shell.log'})
  // .pipe(dest('/mnt/ztev-admin/logs'));
  var sshCur = ssh[options.env]

  var gulpSSH = new GulpSSH({
    ignoreErrors: false,
    sshConfig: {
      ...sshCur,
      path: ""
    }
  })
  console.log(sshCur)

  src(`${BASE_DIR}/**/**.**`).pipe(gulpSSH.dest(sshCur.path))
  cb()
}

exports.sftp = sftp

exports.dev = series(cleanDist, parallel(html, css, js, img, copy), server)

exports.prod = series(cleanDist, parallel(html, css, js, img, copy))
