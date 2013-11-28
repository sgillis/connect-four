'use strict';

var connectFour = angular.module('connectFour', []);

connectFour.factory('socket', function($rootScope) {
    var socket = io.connect();
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

connectFour.controller('GameCtrl', function GameCtrl($scope, socket){
    $scope.game = new Game();

    $scope.makeMove = function(game, x, y){
        var spot = availableSpot(x, y, game.pieces);
        if(spot[1] > -1){
            game.pieces[game.active_player].push(spot);
            var won = fourConnected(game.pieces[game.active_player]);
            if(won){
                game.gameMessage = "P" + (game.active_player + 1) + " won!"
            } else {
                game.active_player = (game.active_player + 1) % 2;
                game.gameMessage = "P" + (game.active_player + 1) + " to move"
            }
        }
    }

    $scope.containsPiece = function(game, p, x, y){
        if(indexOfArr(game.pieces[p], [x, y]) > -1){
            return true;
        }
        return false;
    }

    $scope.reset = function(game){
        game.pieces = [[], []];
        game.active_player = 0;
    }
});

function Game(){
    this.range = [0, 1, 2, 3, 4, 5, 6];
    this.pieces = [[], []];
    this.active_player = 0;
    this.gameMessage = "Welcome to 'Connectfour'!";
}
