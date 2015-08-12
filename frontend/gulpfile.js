// NOT FOR PRODUCTION USE. Sample files only

var gulp = require("gulp");
var RevAll = require("gulp-rev-all");
var liveReload = require("gulp-livereload");
var sourcemaps = require("gulp-sourcemaps");
var browserify = require("browserify");
var source = require("vinyl-source-stream");
var buffer = require('vinyl-buffer');
var fs = require("fs");
var glob = require('glob');
var less = require("gulp-less");
var autoprefixer = require("gulp-autoprefixer");
var concat = require('gulp-concat');
var bower = require('bower');
var del = require('del');
var async = require('async');
var coffee = require("coffeeify");
var uglify = require("gulp-uglify");

var config = {
    assets: "./assets",
    vendorDir: "./vendor/assets",
    bowerDir: "./bower_components",
    dist: "dist",
    deployDir: "../public"
};

// bunch of functions to make later directory use a little easier
var getAssetsDir = function (assetType) {
    return config.assets + "/" + assetType;
};

var getAssets = function (assetType) {
    //return config.assets + "/" + assetType +"/**/*";
    return getAssetsDir(assetType) + "/**/*";
};

var getDistDir = function (assetType) {
    return config.dist + "/" + assetType;
};

var getVendorAssetsDir = function(assetType){
    return config.vendorDir + "/" + assetType;
};

var getVendorAssets = function (assetType) {
    return getVendorAssetsDir(assetType) + "/**/*";
};

// create  directories if they dont exist
// only need to run this to setup the project
gulp.task("setup-directories", function () {
    fs.mkdir(config.assets, function(){
        fs.mkdir(getAssetsDir("fonts"), function (err) {
        });
        fs.mkdir(getAssetsDir("images"), function (err) {
        });
        fs.mkdir(getAssetsDir("javascripts"), function (err) {
        });
        fs.mkdir(getAssetsDir("stylesheets"), function (err) {
        });
    });
    fs.mkdir(config.vendorDir, function(){
        fs.mkdir(getVendorAssetsDir("fonts"), function (err) {
        });
        fs.mkdir(getVendorAssetsDir("images"), function (err) {
        });
        fs.mkdir(getVendorAssetsDir("javascripts"), function (err) {
        });
    })
});

// deploy contents of dist to public
gulp.task("deploy", function () {
    gulp.src(config.dist + "/**/*")
        .pipe(gulp.dest(config.deployDir));
});

// clean up dist directories
gulp.task("clean", function (callback) {
    // clean up the dist directory
    del.sync(['dist/**', '!dist']);
    callback();
});

// build Less function
var execLess = function (callback) {
    console.log("execLess starting");
    gulp.src(getAssetsDir("less") + "/application.less")
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(getDistDir("stylesheets")))
        .on('end', function () {
            callback(null, "execLess has completed")
        })
};

// consolidate fonts function
var execFonts = function (callback) {
    console.log("execFonts starting");
    gulp.src([getAssets("fonts"), getVendorAssets("fonts")])
        .pipe(gulp.dest(getDistDir("fonts")))
        .pipe(liveReload())
        .on('end', function () {
            callback(null, "execFonts has completed")
        })

};

// consolidate images function
var execImages = function (callback) {
    console.log("execImages starting");
    var revAll = new RevAll();
    gulp.src([getAssets("images"), getVendorAssets("images")])
        // asset digest turned off for now
        //.pipe(revAll.revision())
        .pipe(gulp.dest(getDistDir("images")))
        //.pipe(revAll.manifestFile())
        //.pipe(gulp.dest("./"))
        .pipe(liveReload())
        .on('end', function () {
            callback(null, "execImages has completed")
        })
};

// consolidate javascripts function
// right now sourcemaps are always being prepared
var execJavascripts = function (callback) {
    var files = glob.sync(getAssets("javascripts"));
    var stream = browserify({
        entries: [files],
        debug: true,
        transform: ['coffeeify'],
        extensions: [".js", ".coffee"]
    }).bundle();
    // now stream it
    stream.pipe(source("application.js"))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // add in your favorite things
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(getDistDir("javascripts")))
        .pipe(liveReload())
        .on('end', function () {
            callback(null, "execJavascripts has completed")
        })
};

// task wrappers to run build task individually if needed
gulp.task("javascripts", function () {
    execJavascripts(function (err, message) {
        console.log(message);
    });
});

// build task with dependency on clean being completed
gulp.task("build", ["clean"], function (callback) {
    execLess(function (err, message) {
        console.log(message);
    });
    execFonts(function (err, message) {
        console.log(message);
    });
    execImages(function (err, message) {
        console.log(message);
    });
    execJavascripts(function (err, message) {
        console.log(message);
    });
});

// task to move bower files for ingestion
gulp.task("copy-libraries", ["copy-bootstrap", "copy-font-awesome"]);

// specific task to copy bootstrap
gulp.task("copy-bootstrap", function () {
    gulp.src(config.bowerDir + "/bootstrap/dist/fonts/**.*")
        .pipe(gulp.dest(config.vendorDir + "/fonts"));
    gulp.src(config.bowerDir + "/bootstrap/dist/js/bootstrap.js")
        .pipe(gulp.dest(config.vendorDir + "/javascripts"));
    gulp.src(config.bowerDir + "/bootstrap/less/**/*")
        .pipe(gulp.dest(getAssetsDir("less") + "/bootstrap"))
});

// specific task to copy font awesome
gulp.task("copy-font-awesome", function () {
    gulp.src(config.bowerDir + "/font-awesome/fonts/**.*")
        .pipe(gulp.dest(config.vendorDir + "/fonts"));
    gulp.src(config.bowerDir + "/font-awesome/less/**/*")
        .pipe(gulp.dest(getAssetsDir("less") + "/font-awesome"));
});

// run bower to pull down latest 3rd party versions
gulp.task("bower", function (callback) {
    bower.commands.install().on("end", function (installed) {
        callback();
    });
});
