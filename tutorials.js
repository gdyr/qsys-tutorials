angular.module('qsys-scripting-tutorials', ['ui.ace'])

  .service('Moonshine', function($rootScope, $window) {

    return {

      init: function(conf) {
        if(!conf) { conf = {}; }
        if(conf.stdout) {
          $window.shine.stdout.write = function(msg) {
            conf.stdout(msg);
          }
        }
        $rootScope.moonshine = new $window.shine.VM(conf.api);
        $window.shine.luac.init($rootScope.moonshine, 'moonshine/yueliang.lua.json');
      },

      compile: function(code) {
        return {
          then: function(callback) {
            $window.shine.luac.compile(code, callback);
          }
        }
      },

      run: function(bytecode) {
        $rootScope.moonshine._resetGlobals();
        $rootScope.moonshine.load(bytecode);
      }

    };

  })

  .controller('ScriptingController', function($scope, $timeout, Moonshine) {

    // Set up stdout
    $scope.stdout = '';
    Moonshine.init({
      stdout: function(msg) {
        $scope.stdout += (msg + "\n");
        console.log(msg, $scope.stdout);
      }
    });

    // Compiler
    $scope.compile = function(src) {
      $scope.sync = true;
      Moonshine.compile(src)
        .then(function(err, bytecode) {
          if(bytecode) {
            $scope.stdout = '';
            Moonshine.run(bytecode);
          }
        });
    };

    // Sample script
    $scope.script = `print('hello world!');`

    // Script dirty watch
    $scope.sync = true;
    $scope.$watch('script', function(newValue, oldValue) {
      if(newValue != oldValue) {
        $scope.sync = false;
      }
    });

  })