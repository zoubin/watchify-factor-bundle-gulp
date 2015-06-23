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
var files = [];
b.on('factor.pipeline', function (file, pipeline) {
    files.push(file);
    if (pipelines.push(pipeline) === entries.length) {
        b.emit('factor.pipelines', files, pipelines);
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
            consume(files, pipelines, outputs, resolve);
        }
        else {
            b.once('factor.pipelines', function (files, pipelines) {
                consume(files, pipelines, outputs, resolve);
            });
        }
    });
}

function consume(files, pipelines, outputs, done) {
    pipelines.forEach(function (pipeline, i) {
        var file = files[i];
        // we have to cut off the old outputs
        pipeline.unpipe();
        // and build a new one writable
        var o = getOutput(file);
        pipeline.pipe(o);
        outputs.push(o);
    });

    // pipelines are consumed, make it available for next `factor.pipelines` event
    pipelines.length = 0;
    files.length = 0;

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
