var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var babel = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var gubabel = require("gulp-babel");

const eslint = require('gulp-eslint');

function lint() {
    // ESLint ignores files with "node_modules" paths.
    // So, it's best to have gulp ignore the directory as well.
    // Also, Be sure to return the stream from the task;
    // Otherwise, the task may end before the stream has finished.
    return gulp.src(['src/**/*.js','!node_modules/**'])
        // eslint() attaches the lint output to the "eslint" property
        // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
}




function client() {

   var bundler = browserify({
                insertGlobals : true
                , entries : ['./src/index.js']
                , standalone: 'chunkupload'
        }).transform(
                       babel.configure({
                                            // Use all of the ES2015 spec
                                            presets: ["es2015"]
                                        }));
  var b = bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('index.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./bin'));

      return b;
 
  
}

function server(){
    
          return gulp.src(["src/**/*.js", '!src/index.js'])
            .pipe(sourcemaps.init())
            .pipe(gubabel( {presets: ["es2015"]} ))
            .pipe(sourcemaps.write("."))
            .pipe(gulp.dest("bin"));

};

gulp.task('client', client);
gulp.task('server', server);

gulp.task('build', ['client', 'server']);
gulp.task('default', ['build']);

