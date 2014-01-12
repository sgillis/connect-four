'use strict';

var connectFour = angular.module('connectFour', ['socket-io', 'webworker']);

connectFour.controller('GameCtrl', function GameCtrl($scope, $log, socket, worker){
    $scope.game = new Game();

    // This function is called to submit a move, and decides if it was a valid
    // move
    $scope.move = function(game, x, y){
        if($scope.name == game.active_player){
            var spot = availableSpot(x, y, game.pieces);
            if(spot[1] > -1){
                // Notify server about move
                // TODO: don't notify server when playing against bot
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
        if($scope.bot && game.active_player != $scope.name && !won){
            $scope.bot.move();
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

    $scope.create_bot = function(){
        if($scope.players.length < 2){
            $scope.bot = new Bot($scope, $log, socket);
            $scope.players.push( ($scope.name + 1) % 2 );
        }
    }

    // Webworker
    $scope.start_webworker = function(){
        $log.info('Starting worker');
        var result = worker.doWork('a lot of work');
        result.then(function(data){
            console.log('Worker replied:', data);
        });
    }

    // Socket functions
    socket.on('init', function(data){
        $scope.name = data.name;
        $scope.game_name = data.game_name;
        $scope.players = data.players;
    });

    socket.on('move', function(data){
        if($scope.game_name == data.game_name){
            if(data.name == $scope.game.active_player){
                $scope.makeMove($scope.game, data.move);
            }
        }
    });

    socket.on('user:left', function(data){
        if(data.game_name == $scope.game_name){
            $scope.game.gameMessage = 'Opponent left, please wait for a new opponent.';
        }
        $scope.players = data.players;
    });

    socket.on('user:join', function(data){
        if(data.game_name == $scope.game_name){
            $scope.players = data.players;
            $scope.reset($scope.game);
            $scope.game.gameMessage = 'New opponent, game on!';
        }
    });
});

function Game(){
    this.range = [0, 1, 2, 3, 4, 5, 6];
    this.pieces = [[], []];
    this.active_player = 0;
    this.gameMessage = "Welcome to 'Connectfour'!";
}

function Bot($scope, $log, socket){
    // Let the server know a bot-overlord is born
    socket.emit('bot:joined', {
        game_name: $scope.game_name,
    });

    this.genome = new brain.Genome();
    this.genome.random_generation(49, [ [49, true, 5, 5, 5], [7, false, 5, 5, 5] ]);
    this.brain = new brain.Brain();
    this.brain.initialize(this.genome.weights);

    this.random_move = function(){
        $log.info('bot making move');
        var made_move = false;
        while(made_move == false){
            var spot = availableSpot(Math.floor(Math.random() * 7), 0, $scope.game.pieces);
            if(spot[1] > -1){
                // Make move locally
                $scope.makeMove($scope.game, spot);
                made_move = true;
            }
        }
    }
    
    this.move = function(){
        this.brain.process(piecesArray($scope.game.pieces));
        var largest = Math.max.apply(Math, this.brain.output);
        var position = indexOfArr(this.brain.output, largest);
        var spot = availableSpot(position, 0, $scope.game.pieces);
        if(spot[1] > -1){
            // Make move locally
            $scope.makeMove($scope.game, spot);
        } else {
            // Make random move
            this.random_move()
        }
    }
}
