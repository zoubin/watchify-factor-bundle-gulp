var wrap = require('gulp-watchify-factor-bundle');
var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require('path');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var browserify = require('browserify');

var entries = [ src('blue/index.js'), src('red/index.js') ];
var b = browserify({
    entries: entries,
});

var bundle = wrap(b,
    // options for factor bundle.
    {
        entries: entries,
        outputs: [ 'blue.js', 'red.js' ],
        common: 'common.js',
    },
    // more transforms. Should always return a stream.
    function (bundleStream) {
        return bundleStream
            .on('error', gutil.log.bind(gutil, 'Browserify Error'))

            // `optional`. use `buffer()` to make `stream not support` gulp plugins work
            .pipe(buffer())

            // use more gulp plugins here
            .pipe(uglify())

            .pipe(gulp.dest('./build/js'))
    }
);

b.on('log', gutil.log);
// normal bundle task
gulp.task('default', bundle);
// watchify bundle task
gulp.task('watch', wrap.watch(bundle));

function src() {
    return path.resolve.bind(path, __dirname, 'src/page').apply(null, arguments);
}
