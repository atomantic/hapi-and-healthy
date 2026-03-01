/*!
 * gulp
 */
const gulp = require('gulp'),
    eslint = require('gulp-eslint'),
    lab = require('gulp-lab')

const files = ['./*.js']

// Scripts
gulp.task('js', gulp.series(function () {
    return gulp.src(files)
        .pipe(eslint('.eslintrc'))
}))

gulp.task('test', gulp.series(function () {
    return gulp.src('test/*.js')
        // use lab tests
        // -v verbose
        // -l disable global leak detection
        // -C code coverage
        // -m 0 Timeout zero
        .pipe(lab('-v -l -C -m 0'))
}))

gulp.task('default', gulp.series('js'))
