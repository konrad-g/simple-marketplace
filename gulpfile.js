// When using this build file, be sure to have imports.js file with styles and scripts
var imports = require("./imports");
var gulp = require('gulp');
var clean = require('gulp-clean');
var runSequence = require('gulp-run-sequence');
var uglify = require('gulp-uglifyes');
var cleanCSS = require('gulp-clean-css');
var concatJs = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var typescript = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var scss = require("gulp-scss");

var OUTPIT_FOLDER_PATH = './dist';
var VIEW_SCRIPTS_PATH = 'src/server/app/imports/views/scripts.hbs';
var VIEW_STYLES_PATH = 'src/server/app/imports/views/styles.hbs';

var versionNumber = Math.random().toString(36).substring(8);
var TYPESCRIPT_PATHS = ["./src/client/**/*.ts*", "./src/client/elements/**/*.ts*"];
var SCSS_PATHS = ["./src/client/**/*.scss", "./src/client/elements/**/*.scss*"];

// Client imports

gulp.task('clean', function () {
  // Clean output folder
  return gulp.src(OUTPIT_FOLDER_PATH, {read: false})
    .pipe(clean({force: true}));
});

gulp.task('minimize-js', function () {

  var importScripts = imports.SCRIPTS_LIBRARIES.concat(imports.SCRIPTS_PRODUCTION);
  importScripts = importScripts.concat(imports.SCRIPTS_APP);

  gulp.src(importScripts)
    .pipe(concatJs({path: 'scripts-' + versionNumber + '.min.js'}))
    .pipe(uglify())
    .pipe(gulp.dest(OUTPIT_FOLDER_PATH));

});

gulp.task('minimize-css', function () {

  gulp.src(imports.STYLES)
    .pipe(concatCss('styles-' + versionNumber + '.min.css', {rebaseUrls: true}))
    .pipe(cleanCSS({relativeTo: './public/out/', target: './public/out/', rebase: true}))
    .pipe(gulp.dest(OUTPIT_FOLDER_PATH));

});

gulp.task('minimize-parsley', function () {

  var importScripts = [];
  importScripts = imports.SCRIPTS_LIBRARIES.concat(imports.SCRIPTS_PRODUCTION);
  importScripts = importScripts.concat(imports.SCRIPTS_APP);

  gulp.src("./client-libs/node_modules/parsleyjs/src/i18n/*.js")
    .pipe(uglify())
    .pipe(gulp.dest("./src/client/elements/parsley-lang-min/src"));

});

gulp.task('watch-all', ['watch-ts', 'watch-scss']);
gulp.task('all', ['ts', 'scss']);

// TypeScript
var typescriptProject = typescript.createProject('tsconfig.json', {"target": "es2015", "module": "umd"});

gulp.task('ts', function () {
  return gulp.src(TYPESCRIPT_PATHS, { base: '.' })
    .pipe(sourcemaps.init())
    .pipe(typescriptProject())
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("."));
});

gulp.task('watch-ts', ['ts'], function () {
  gulp.watch(TYPESCRIPT_PATHS, ['ts']);
});

gulp.task('scss', function () {
  return gulp.src(SCSS_PATHS, { base: '.' })
    .pipe(sourcemaps.init())
    .pipe(scss({}))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest("."));
});

gulp.task('watch-scss', function () {
  gulp.watch(SCSS_PATHS, ['scss']);
});

// Generating scripts and styles imports

gulp.task('add-single-imports', function () {

  var fileScriptsContent = "";

  // Add remote scripts
  for (var i = 0; i < imports.SCRIPTS_REMOTE.length; i++) {
    var script = imports.SCRIPTS_REMOTE[i];
    fileScriptsContent += "<script src=\"" + script + "\"></script>" + "\n";
  }

  // Add local scripts
  fileScriptsContent += "<script src=\"/dist/scripts-" + versionNumber + ".min.js\"></script>" + "\n";

  require('fs').writeFileSync(VIEW_SCRIPTS_PATH, fileScriptsContent);

  // Update styles import
  require('fs').writeFileSync(VIEW_STYLES_PATH,
    "<link rel=\"stylesheet\" href=\"/dist/styles-" + versionNumber + ".min.css\" rel=\"stylesheet\" type=\"text/css\" />");

  return;
});

gulp.task('dev', function () {

  // Write single imports
  var fileScriptsContent = "";
  var fileStylesContent = "";

  // Add all scripts
  for (var i = 0; i < imports.SCRIPTS_REMOTE.length; i++) {
    var script = imports.SCRIPTS_REMOTE[i];
    fileScriptsContent += "<script src=\"" + script + "\"></script>" + "\n";
  }

  var importScripts = imports.SCRIPTS_LIBRARIES.concat(imports.SCRIPTS_APP);

  for (var i = 0; i < importScripts.length; i++) {
    var script = importScripts[i];
    script = script.substring(1, script.length);
    fileScriptsContent += "<script src=\"" + script + "\"></script>" + "\n";
  }

  // Add all styles
  for (var i = 0; i < imports.STYLES.length; i++) {
    var style = imports.STYLES[i];
    style = style.substring(1, style.length);
    fileStylesContent += "<link rel=\"stylesheet\" href=\"" + style + "\" rel=\"stylesheet\" type=\"text/css\" />" + "\n";
  }

  // Update scripts import
  require('fs').writeFileSync(VIEW_SCRIPTS_PATH, fileScriptsContent);

  // Update styles import
  require('fs').writeFileSync(VIEW_STYLES_PATH, fileStylesContent);

});

/**
 * Build production project
 */
gulp.task('prod', ['clean'], function () {
  runSequence(
    'ts', 'scss', 'minimize-js', 'minimize-css', 'add-single-imports');
});
