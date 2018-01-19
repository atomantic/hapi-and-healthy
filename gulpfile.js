/*!
 * gulp
 * $ npm install gulp gulp-supervisor opn --save-dev
 */
const gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    supervisor = require('gulp-supervisor'),
    lab = require('gulp-lab'),
    opn = require('opn')

const server = {
        host: 'localhost',
        port: '3192'
    },
    files = ['./*.js']

// Scripts
gulp.task('js', function () {
    return gulp.src(files)
        .pipe(eslint('.eslintrc'))
})

gulp.task('test', function () {
    return gulp.src('test/*.js')
        // use lab tests
        // -v verbose
        // -l disable global leak detection
        // -C code coverage
        // -m 0 Timeout zero
        .pipe(lab('-v -l -C -m 0'))
        .pipe(eslint('.eslintrc'))
})

gulp.task('supervise', function () {
    supervisor('demo.js', {
        args: [],
        watch: ['index.js', 'demo.js'],
        pollInterval: 500,
        extensions: ['js'],
        exec: 'node',
        debug: true,
        debugBrk: false,
        harmony: true,
        noRestartOn: false,
        forceWatch: true,
        quiet: false
    })
})

gulp.task('openbrowser', function () {
    // supervise takes half a second to start it up
    setTimeout(function () {
        opn('http://' + server.host + ':' + server.port + '/service-status')
    }, 500)
})

// Watch
gulp.task('watch', function () {

    // Watch .js files
    gulp.watch(files, ['js'])

})

gulp.task('default', ['js', 'supervise', 'watch', 'openbrowser'])
