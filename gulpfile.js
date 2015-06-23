var gulp = require('gulp');
var gutil = require('gulp-util');
var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var es = require('event-stream');
var path = require('path');

var entries = [ src('blue/index.js'), src('red/index.js') ];
var opts = {
    entries: entries,
};
var b = watchify(browserify(opts));

b.plugin('./factor-bundle-callback', {
    entries: [ src('blue/index.js'), src('red/index.js') ],
    outputs: function () {
        return [ source('blue.js'), source('red.js') ];
    },
});

gulp.task('default', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
    return new Promise(function (resolve) {
        var common = b.bundle().pipe(source('common.js'));
        b.once('factor.pipelines', function (files, pipelines, outputs) {
            es.merge(outputs.concat(common))
                // log errors if they happen
                .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                .pipe(gulp.dest('./build/js'))
                .on('finish', function () {
                    resolve();
                });
        });
    });
}

function src() {
    return path.resolve.bind(path, __dirname, 'src/page').apply(null, arguments);
}
