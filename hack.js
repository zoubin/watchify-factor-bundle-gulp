var gulp = require('gulp');
var gutil = require('gulp-util');

var watchify = require('watchify');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

var mergeStream = require('multistream-merge');

var path = require('path');

function src() {
    return path.resolve.bind(path, __dirname, 'src/page').apply(null, arguments);
}

var opts = {
    entries: [ src('blue/index.js'), src('red/index.js') ],
    debug: true,
};
var b = watchify(browserify(opts));

var entries = [ src('blue/index.js'), src('red/index.js') ];
// add transformations here
// i.e. b.transform(coffeeify);
b.plugin('factor-bundle', {
    entries: entries,
    outputs: entries.map(getOutput),
});

gulp.task('default', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function getOutput(file) {
    return source(path.basename(path.dirname(file)) + '.js');
}
function bundle() {
    return new Promise(function (resolve) {
        var common = b.bundle().pipe(source('common.js'));
        var c = 0;
        var outputs = [common];
        b.on('factor.pipeline', repipe);

        function repipe(file, pipeline) {
            pipeline.unpipe();
            var o = getOutput(file);
            outputs.push(o);
            pipeline.pipe(o);
            if (++c === entries.length) {
                b.removeListener('factor.pipeline', repipe);
                mergeStream.obj(outputs)
                    // log errors if they happen
                    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                    .pipe(gulp.dest('./build/js'))
                    .on('finish', function () {
                        resolve();
                    });
            }
        }
    });
}
