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

  .service('QSysAPI', function(uuid4, $http) {

    var timers = [];

    var QSysEOLConstants = {
      Any: 'ANY',
      CrLf: 'CRLF',
      CrLfStrict: 'CRLF_STRICT',
      Lf: 'LF',
      Null: 'NULL',
      Custom: 'CUSTOM'
    };

    var QSysEventConstants = {
      Connected: 'CONNECTED',
      Reconnect: 'RECONNECT',
      Data: 'DATA',
      Closed: 'CLOSED',
      Error: 'ERROR',
      Timeout: 'TIMEOUT'
    };

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
        },

        // TCP Sockets
        TcpSocket: {
          Events: QSysEventConstants,
          EOL: QSysEOLConstants,
          New: function() {
            return {
              Connect: function() {},
              Disconnect: function() {},
              Write: function() {},
              Read: function() {},
              ReadLine: function() {},
              Search: function() {}
            }
          }
        },

        // Serial Ports
        SerialPorts: [{
          Open: function() {},
          Close: function() {},
          Write: function() {},
          Read: function() {},
          ReadLine: function() {},
          Search: function() {}
        }],

        // HTTP Client
        HttpClient: {
          Download: function(tbl) {
            $http({
              method: 'GET',
              url: 'https://crossorigin.me/'+tbl.Url,
              headers: tbl.Headers
            }).then(function success(response) {
              console.log(response);
              tbl.EventHandler.call(null, response, response.status, response.data);
            }, function error(response) {
              console.error(response);
            })
          },
          Upload: function() {
            // TODO: Implement upload somehow
          }
        },

        // Constants
        ChannelGroup: { Index: 0 },
        System: { IsEmulating: false }

      }

    };
  })

  .controller('ScriptingController', function($scope, $timeout, Moonshine, QSysAPI) {

    // Set up stdout
    $scope.stdout = '';
    Moonshine.init({
      stdout: function(msg) {
        $timeout(function() {
          $scope.$apply(function() {
            $scope.stdout += (msg + "\n");
          });
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