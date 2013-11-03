'use strict';

var connectFour = angular.module('connectFour', []);

connectFour.factory('game', function(){
    return new Game();
});

connectFour.controller('GameCtrl', function GameCtrl($scope, game){
    $scope.game = game;
});

function Game(){
    this.range = [0, 1, 2, 3, 4, 5, 6];
    this.pieces = [[], []];
    this.active_player = 0;
    
    this.gameMessage = "Welcome to 'Connectfour'!";

    this.containsPiece = function(p, x, y){
        if(indexOfArr(this.pieces[p], [x, y]) > -1){
            return true;
        }
        return false;
    };
    
    this.makeMove = function(x, y){
        var spot = availableSpot(x, y, this.pieces);
        if(spot[1] > -1){
            this.pieces[this.active_player].push(spot);
            this.active_player = (this.active_player + 1) % 2;
        }
    };
}
