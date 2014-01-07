angular.module('socket-io', []).
    factory('socket', function($rootScope) {
        var socket = io.connect('http://localhost:3000');
        return {
            on: function(eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function(eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    if(callback) {
                        callback.apply(socket, args);
                    }
                });
            }
        };
    });

angular.module('webworker', []).
    factory('worker', ['$q', '$log', function($q, $log){
        var worker = new Worker('js/webworker.js');
        var defer;
        worker.onmessage = function(e){
            defer.resolve(e.data);
        };

        return {
            doWork: function(data){
                defer = $q.defer();
                console.log('Submitting:',data);
                worker.postMessage(data);
                return defer.promise;
            }
        };
    }]);
