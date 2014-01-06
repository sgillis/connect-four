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
    factory('worker', ['$q', function($q){
        var worker = new Worker('js/webworker.js');
        var defer;
        // worker.addEventListener('message', function(e){
        //     console.log('Worker said: ', e.data);
        //     defer.resolve(e.data);
        // }, false);
        worker.onmessage = function(e){
            console.log('worker finished');
        };

        return {
            doWork: function(data){
                defer = $q.defer();
                worker.postMessage(data);
                return defer.promise;
            }
        };
    }]);
