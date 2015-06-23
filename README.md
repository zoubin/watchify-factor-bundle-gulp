# watchify-factor-bundle-gulp
Example to use watchify + factor-bundle + gulp

## Usage

Here is a solution based on the [pull-request](https://github.com/substack/factor-bundle/pull/73)

```bash
git clone https://github.com/zoubin/watchify-factor-bundle-gulp.git
cd watchify-factor-bundle-gulp
npm i
cd factor-bundle-callback
npm i

gulp
```

And this is a solution based on a hack:

```bash
git clone https://github.com/zoubin/watchify-factor-bundle-gulp.git
cd watchify-factor-bundle-gulp
npm i

gulp --gulpfile hack.js
```

## gulpfile.js

```javascript
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

```

## hack.js

```javascript
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

```
