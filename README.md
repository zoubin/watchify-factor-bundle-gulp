# watchify-factor-bundle-gulp
Example to use watchify + factor-bundle + gulp

## Usage

```bash
git clone https://github.com/zoubin/watchify-factor-bundle-gulp.git
cd watchify-factor-bundle-gulp
npm i
npm i zoubin/factor-bundle#feature-callback-outputs

gulp
```

## gulpfile.js

```javascript
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

// add transformations here
// i.e. b.transform(coffeeify);
b.plugin('factor-bundle', {
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
        b.once('factor.outputs', function (o) {
            outputs = o.concat(common);
            mergeStream.obj(outputs)
                // log errors if they happen
                .on('error', gutil.log.bind(gutil, 'Browserify Error'))
                .pipe(gulp.dest('./build/js'))
                .on('finish', function () {
                    resolve();
                });
        });
    });
}

```
