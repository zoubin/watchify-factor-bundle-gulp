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

```
