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

var pipelines = [];
b.on('factor.pipeline', function (file, pipeline) {
    if (pipelines.push([file, pipeline]) === entries.length) {
        b.emit('factor.pipelines', pipelines);
    }
});
b.plugin('factor-bundle', {
    entries: entries,
    outputs: entries.map(getOutput),
});

gulp.task('default', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
    return new Promise(function (resolve) {
        var outputs = [b.bundle().pipe(source('common.js'))];

        if (pipelines.length === entries.length) {
            consume(pipelines, outputs, resolve);
        }
        else {
            b.once('factor.pipelines', function (pipelines) {
                consume(pipelines, outputs, resolve);
            });
        }
    });
}

function consume(pipelines, outputs, done) {
    pipelines.forEach(function (info) {
        var file = info[0];
        var pipeline = info[1];
        // we have to cut off the old outputs
        pipeline.unpipe();
        // and build a new one writable
        var o = getOutput(file);
        pipeline.pipe(o);
        outputs.push(o);
    });
    // pipelines are consumed, make it available for next `factor.pipelines` event
    pipelines.length = 0;

    es.merge(outputs)
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(gulp.dest('./build/js'))
        .on('finish', function () {
            done && done();
        });
}

function src() {
    return path.resolve.bind(path, __dirname, 'src/page').apply(null, arguments);
}
function getOutput(file) {
    return source(path.basename(path.dirname(file)) + '.js');
}
