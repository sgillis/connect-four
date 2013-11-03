'use strict';

var connectFour = angular.module('connectFour', []);

connectFour.factory('game', function(){
    return new Game();
});

connectFour.controller('GameCtrl', function GameCtrl($scope, game) {
    $scope.game = game;
});

function Game(){
    this.range = [0, 1, 2, 3, 4, 5, 6];
    this.pieces = [];
    this.active_player = 0;
    
    this.gameMessage = "Welcome to 'Connectfour'!";

    this.containsPiece = function(p, x, y) {

    };
    
    this.makeMove = function(x, y){

    };
}
