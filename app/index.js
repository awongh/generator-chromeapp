'use strict';

var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');
var manifest = require('../manifest');

//angular settings
var fs = require('fs');
var angularUtils = require('../util.js');
var chalk = require('chalk');
var wiredep = require('wiredep');

var ChromeAppGenerator = module.exports = function ChromeAppGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // set source root path to templates
  this.sourceRoot(path.join(__dirname, 'templates'));

  // create a default manifest
  this.manifest = new manifest({
    'icons': {
      '16': 'images/icon-16.png',
      '128': 'images/icon-128.png'
    },
    'app': {
      'background': {
        'scripts': [
          'scripts/main.js',
          'scripts/chromereload.js'
        ]
      }
    }
  });

  // setup the test-framework property, Gruntfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';

  // for hooks to resolve on mocha by default
  if (!options['test-framework']) {
    options['test-framework'] = 'mocha';
  }

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', { as: 'app' });

  // add more permissions
  this.hookFor('chromeapp:permission', { as: 'subgen' });

  //this.on('end', function () {
  //  this.installDependencies({ skipInstall: options['skip-install'] });
  //});

  //this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));

  // ========================================
  // ========================================
  // ========================================
  //        Start, angular stuff
  // ========================================
  // ========================================
  // ========================================


  //yeoman.generators.Base.apply(this, arguments);

  //this.argument('appname', { type: String, required: false });
  //this.appname = this.appname || path.basename(process.cwd());

  this.appname = this._.camelize(this._.slugify(this._.humanize(this.appname)));

  this.option('app-suffix', {
    desc: 'Allow a custom suffix to be added to the module name',
    type: String,
    required: 'false'
  });

  this.scriptAppName = this.appname + angularUtils.appName(this);

  args = ['main'];

  if (typeof this.env.options.appPath === 'undefined') {
    try {
      this.env.options.appPath = require(path.join(process.cwd(), 'bower.json')).appPath;
    } catch (e) {}
    this.env.options.appPath = this.env.options.appPath || 'angular-app';
  }

  this.appPath = this.env.options.appPath;

  if (typeof this.env.options.coffee === 'undefined') {
    this.option('coffee', {
      desc: 'Generate CoffeeScript instead of JavaScript'
    });

    // attempt to detect if user is using CS or not
    // if cml arg provided, use that; else look for the existence of cs
    if (!this.options.coffee &&
      this.expandFiles(path.join(this.appPath, '/scripts/**/*.coffee'), {}).length > 0) {
      this.options.coffee = true;
    }

    this.env.options.coffee = this.options.coffee;
  }

  if (typeof this.env.options.minsafe === 'undefined') {
    this.option('minsafe', {
      desc: 'Generate AngularJS minification safe code'
    });
    this.env.options.minsafe = this.options.minsafe;
    args.push('--minsafe');
  }

  this.hookFor('angular:common', {
    args: args
  });

  this.hookFor('angular:main', {
    args: args
  });

  this.hookFor('angular:controller', {
    args: args
  });

  this.on('end', function () {
    this.installDependencies({
      skipInstall: this.options['skip-install'],
      callback: this._injectDependencies.bind(this)
    });

    var enabledComponents = [];

    if (this.resourceModule) {
      enabledComponents.push('angular-resource/angular-resource.js');
    }

    if (this.cookiesModule) {
      enabledComponents.push('angular-cookies/angular-cookies.js');
    }

    if (this.sanitizeModule) {
      enabledComponents.push('angular-sanitize/angular-sanitize.js');
    }

    if (this.routeModule) {
      enabledComponents.push('angular-route/angular-route.js');
    }

    this.invoke('karma:app', {
      options: {
        coffee: this.options.coffee,
        travis: true,
        'skip-install': this.options['skip-install'],
        components: [
          'angular/angular.js',
          'angular-mocks/angular-mocks.js'
        ].concat(enabledComponents)
      }
    });

  });

  this.pkg = require('../package.json');

  // ========================================
  //        end, angular stuff
  // ========================================

};

util.inherits(ChromeAppGenerator, yeoman.generators.Base);

ChromeAppGenerator.prototype.askFor = function askFor(argument) {
  var cb = this.async();
  var prompts = [{
    name: 'appName',
    message: 'What would you like to call this application?',
    default:  (this.appname) ? this.appname : 'myChromeApp'
  }, {
    name: 'appDescription',
    message: 'How would you like to describe this application?',
    default: 'My Chrome App'
  }];

  this.prompt(prompts, function(answers) {
    var encode = function(str) {return str && str.replace(/\"/g, '\\"');};
    this.appName = encode(answers.appName);
    this.appDescription = encode(answers.appDescription);
    cb();
  }.bind(this));
};

// ========================================
// ========================================
// ========================================
//        Start, angular stuff
// ========================================
// ========================================
// ========================================

ChromeAppGenerator.prototype.welcome = function welcome() {
  // welcome message
  if (!this.options['skip-welcome-message']) {
    console.log(this.yeoman);
    console.log(
      'Out of the box I include Bootstrap and some AngularJS recommended modules.\n'
    );

    // Deprecation notice for minsafe
    if (this.options.minsafe) {
      console.warn(
        '\n** The --minsafe flag is being deprecated in 0.7.0 and removed in ' +
        '0.8.0. For more information, see ' +
        'https://github.com/yeoman/generator-angular#minification-safe. **\n'
      );
    }
  }
};

ChromeAppGenerator.prototype.askForCompass = function askForCompass() {
  var cb = this.async();

  this.prompt([{
    type: 'confirm',
    name: 'compass',
    message: 'Would you like to use Sass (with Compass)?',
    default: true
  }], function (props) {
    this.compass = props.compass;

    cb();
  }.bind(this));
};

ChromeAppGenerator.prototype.askForBootstrap = function askForBootstrap() {
  var compass = this.compass;
  var cb = this.async();

  this.prompt([{
    type: 'confirm',
    name: 'bootstrap',
    message: 'Would you like to include Twitter Bootstrap?',
    default: true
  }, {
    type: 'confirm',
    name: 'compassBootstrap',
    message: 'Would you like to use the Sass version of Twitter Bootstrap?',
    default: true,
    when: function (props) {
      return props.bootstrap && compass;
    }
  }], function (props) {
    this.bootstrap = props.bootstrap;
    this.compassBootstrap = props.compassBootstrap;

    cb();
  }.bind(this));
};

ChromeAppGenerator.prototype.askForModules = function askForModules() {
  var cb = this.async();

  var prompts = [{
    type: 'checkbox',
    name: 'modules',
    message: 'Which modules would you like to include?',
    choices: [{
      value: 'resourceModule',
      name: 'angular-resource.js',
      checked: true
    }, {
      value: 'cookiesModule',
      name: 'angular-cookies.js',
      checked: true
    }, {
      value: 'sanitizeModule',
      name: 'angular-sanitize.js',
      checked: true
    }, {
      value: 'routeModule',
      name: 'angular-route.js',
      checked: true
    }]
  }];

  this.prompt(prompts, function (props) {
    //var hasMod = function (mod) { return props.modules.indexOf(mod) !== -1; };

    var hasMod = function (mod) { 
      if( props.modules && props.modules.hasOwnProperty( mod ) && props.modules.indexOf(mod) ){

        return true;
      }
      return false;
    };

    this.resourceModule = hasMod('resourceModule');
    this.cookiesModule = hasMod('cookiesModule');
    this.sanitizeModule = hasMod('sanitizeModule');
    this.routeModule = hasMod('routeModule');

    var angMods = [];

    if (this.cookiesModule) {
      angMods.push("'ngCookies'");
    }

    if (this.resourceModule) {
      angMods.push("'ngResource'");
    }
    if (this.sanitizeModule) {
      angMods.push("'ngSanitize'");
    }
    if (this.routeModule) {
      angMods.push("'ngRoute'");
      this.env.options.ngRoute = true;
    }

    if (angMods.length) {
      this.env.options.angularDeps = "\n  " + angMods.join(",\n  ") +"\n";
    }

    cb();
  }.bind(this));
};

ChromeAppGenerator.prototype.readIndex = function readIndex() {
  this.ngRoute = this.env.options.ngRoute;
  this.indexFile = this.engine(this.read('index.html'), this);
};

ChromeAppGenerator.prototype.bootstrapFiles = function bootstrapFiles() {
  var sass = this.compass;
  var mainFile = 'main.' + (sass ? 's' : '') + 'css';

  if (this.bootstrap && !sass) {
    this.copy('fonts/glyphicons-halflings-regular.eot', 'app/fonts/glyphicons-halflings-regular.eot');
    this.copy('fonts/glyphicons-halflings-regular.ttf', 'app/fonts/glyphicons-halflings-regular.ttf');
    this.copy('fonts/glyphicons-halflings-regular.svg', 'app/fonts/glyphicons-halflings-regular.svg');
    this.copy('fonts/glyphicons-halflings-regular.woff', 'app/fonts/glyphicons-halflings-regular.woff');
  }

  //this.copy('styles/' + mainFile, 'app/styles/' + mainFile);
};

ChromeAppGenerator.prototype.appJs = function appJs() {
  this.indexFile = this.appendFiles({
    html: this.indexFile,
    fileType: 'js',
    optimizedPath: 'scripts/scripts.js',
    sourceFileList: ['scripts/app.js', 'scripts/controllers/main.js'],
    searchPath: ['.tmp', 'app']
  });
};

ChromeAppGenerator.prototype.createIndexHtml = function createIndexHtml() {
  this.indexFile = this.indexFile.replace(/&apos;/g, "'");
  this.write('app/index.html', this.indexFile);
};


ChromeAppGenerator.prototype.packages = function packages() {
  this.mkdir('app/bower_components');
  this.template('_bower.json', 'bower.json');
  //this.copy('bowerrc', '.bowerrc');
  this.copy('editorconfig', '.editorconfig');
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
  this.copy('jshintrc', '.jshintrc');
  this.template('Gruntfile.js');
};

//everything that goes in the app dir
ChromeAppGenerator.prototype.app = function app() {
  this.directory('images', 'app/images');
  this.directory('scripts', 'app/scripts');
  this.directory('styles', 'app/styles');
  this.template('chromeindex.html', 'app/chromeindex.html', this);
  this.template('_locales/en/messages.json', 'app/_locales/en/messages.json', this);
  this.write('app/manifest.json', this.manifest.stringify());
};



//Generator.prototype.packageFiles = function () {
//  this.coffee = this.env.options.coffee;
//  this.template('../../templates/common/_bower.json', 'bower.json');
//  this.template('../../templates/common/_package.json', 'package.json');
//  this.template('../../templates/common/Gruntfile.js', 'Gruntfile.js');
//};

//ChromeAppGenerator.prototype.imageFiles = function () {
//  this.sourceRoot(path.join(__dirname, 'templates'));
//  this.directory('images', 'app/images', true);
//};

ChromeAppGenerator.prototype._injectDependencies = function _injectDependencies() {
  var howToInstall =
    '\nAfter running `npm install & bower install`, inject your front end dependencies into' +
    '\nyour HTML by running:' +
    '\n' +
    chalk.yellow.bold('\n  grunt bower-install');

  if (this.options['skip-install']) {
    console.log(howToInstall);
  } else {
    wiredep({
      directory: 'app/bower_components',
      bowerJson: JSON.parse(fs.readFileSync('./bower.json')),
      ignorePath: 'app/',
      htmlFile: 'app/index.html',
      cssPattern: '<link rel="stylesheet" href="{{filePath}}">'
    });

    //add bower install for this too
    wiredep({
      directory: 'app/bower_components',
      bowerJson: JSON.parse(fs.readFileSync('./bower.json')),
      ignorePath: 'app/',
      htmlFile: 'app/chromeindex.html',
      cssPattern: '<link rel="stylesheet" href="{{filePath}}">'
    });

  }
};
