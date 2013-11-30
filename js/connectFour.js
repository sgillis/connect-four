'use strict';

var connectFour = angular.module('connectFour', ['socket-io']);

connectFour.controller('GameCtrl', function GameCtrl($scope, $log, socket){
    $scope.game = new Game();

    // This function is called to submit a move, and decides if it was a valid
    // move
    $scope.move = function(game, x, y){
        if($scope.name == game.active_player){
            var spot = availableSpot(x, y, game.pieces);
            if(spot[1] > -1){
                // Notify server about move
                socket.emit('move', {
                    move: spot,
                    game_name: $scope.game_name,
                    name: $scope.name
                });

                // Make move locally
                $scope.makeMove(game, spot);
            }
        }
    }

    // This function is called when a valid move was submitted
    $scope.makeMove = function(game, spot){
        game.pieces[game.active_player].push(spot);
        var won = fourConnected(game.pieces[game.active_player]);
        if(won){
            game.gameMessage = "P" + (game.active_player + 1) + " won!"
        } else {
            game.active_player = (game.active_player + 1) % 2;
            game.gameMessage = "P" + (game.active_player + 1) + " to move"
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

    // Socket functions
    socket.on('init', function(data){
        $scope.name = data.name;
        $scope.game_name = data.game_name;
    });

    socket.on('move', function(data){
        $log.info(data);
        if($scope.game_name == data.game_name){
            if(data.name == $scope.game.active_player){
                $scope.makeMove($scope.game, data.move);
            }
        }
    });
});

function Game(){
    this.range = [0, 1, 2, 3, 4, 5, 6];
    this.pieces = [[], []];
    this.active_player = 0;
    this.gameMessage = "Welcome to 'Connectfour'!";
}
