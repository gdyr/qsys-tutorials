angular.module('qsys-scripting-tutorials', ['ui.ace', 'uuid'])

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

  .service('QSysAPI', function(uuid4) {

    var timers = [];

    return {

      reset: function() {
        for(var i in timers) {
          clearInterval(timers[i]);
        } timers = [];
      },

      api: {

        Timer: {
          New: function() {
            var timerID = uuid4.generate();
            return {
              Start: function(self, interval) {
                timers[timerID] = setInterval(function() {
                  self.EventHandler.call();
                }, interval*1000);
              },
              Stop: function(self) {
                clearInterval(timers[timerID]);
                delete timers[timerID];
              }
            }
          }
        }

      }

    };
  })

  .controller('ScriptingController', function($scope, $timeout, Moonshine, QSysAPI) {

    // Set up stdout
    $scope.stdout = '';
    Moonshine.init({
      stdout: function(msg) {
        $scope.$apply(function() {
          $scope.stdout += (msg + "\n");
        });
      },
      api: QSysAPI.api
    });

    // Compiler
    $scope.compile = function(src) {
      $scope.sync = true;
      QSysAPI.reset();
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