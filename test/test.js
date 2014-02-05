/*global describe, it */
'use strict';
var assert = require('assert');
var path = require('path');
var helpers = require('yeoman-generator').test;

describe('#app', function () {
  beforeEach(function (done) {
    helpers.testDirectory(path.join(__dirname, 'temp'), function (err) {
      if (err) {
        return done(err);
      }

      this.chromeapp = helpers.createGenerator('chromeapp:app', [
          '../../app',
          [
            helpers.createDummyGenerator(),
            'chromeapp:permission'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:common'
          ],

          [
            helpers.createDummyGenerator(),
            'angular:main'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:controller'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:decorator'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:directive'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:factory'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:filter'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:provider'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:route'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:service'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:value'
          ],
          [
            helpers.createDummyGenerator(),
            'angular:view'
          ],
          [
            helpers.createDummyGenerator(),
            'karma:app'
          ],
          [
            helpers.createDummyGenerator(),
            'mocha:app'
          ]
      ]);

      this.chromeapp.options['skip-install'] = true;

      done();
    }.bind(this));
  });

  describe('#app', function() {
    it('should create expected files', function (done) {

     var expected = [
        'app/bower_components',
        //['bower.json', /"name": "temp"/],
        //['package.json', /"name": "temp"/],
        'Gruntfile.js',
        'app/manifest.json',
        'app/_locales/en/messages.json',
        'app/images/icon-128.png',
        'app/images/icon-16.png',
        'app/styles/main.css',
        'app/scripts/main.js',
        'app/index.html'
      ];

      helpers.mockPrompt(this.chromeapp, {
        'name': 'temp',
        'compass' : 'y',
        'bootstrap' : 'y',
        'compassBootstrap' : 'y',
        permissions: [],
        matchPatterns: [],
        socketPermission:[]
      });

      this.chromeapp.options['skip-install'] = true;
      this.chromeapp.run({}, function () {
        helpers.assertFile(expected);
        done();
      });
    });

    it('should populate appName.message', function (done) {
      var expected = [
        'app/_locales/en/messages.json',
        //['app/_locales/en/messages.json', /("message": "Paul")/],
        //['app/_locales/en/messages.json', /"message": "PauL is Awesome"/]
      ];

      helpers.mockPrompt(this.chromeapp, {
        'appName': 'Paul',
        'appDescription': 'PauL is Awesome',
        permissions: [],
        matchPatterns: [],
        socketPermission:[]
      });

      this.chromeapp.options['skip-install'] = true;
      this.chromeapp.run({}, function () {
        helpers.assertFile(expected);
        done();
      });
    });
  });
});
