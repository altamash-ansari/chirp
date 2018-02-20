var gulp        = require('gulp');
var fs          = require('fs');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var buffer      = require('vinyl-buffer');
var semver      = require('semver');
var runSequence = require('run-sequence');
var rimraf      = require('rimraf');
var path        = require('path');

var gulpLoadPlugins = require('gulp-load-plugins'),
    plugins = gulpLoadPlugins();

function combineFileName(str) {
  var array = __dirname.split('/');
  return array.join("/")+str;
}

gulp.task('build',function(cb) {
  return browserify({
    entries: ['./client/js/index.js']
  })
  .bundle()
  .pipe(source('bundle.js'))
  // .pipe(buffer())
  // .pipe(plugins.uglify())
  .pipe(gulp.dest('./client'));
});

gulp.task('copy-images',['browserify'],function(){
  return gulp.src('./client/img/**')
  .pipe(gulp.dest('./build/client/img'))
});

gulp.task('copy-server',['browserify'],function(){
  return gulp.src('./server/**')
  .pipe(gulp.dest('./build/server'))
});

// gulp.task('build',['browserify','copy-images', 'copy-server'],function(){
//   return gulp.src('./build/**')
//   .pipe(plugins.zip('build.zip'))
//   .pipe(gulp.dest('./dist'))
// })