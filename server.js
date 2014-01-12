var express = require('express');
var app = express();
var server = require('http').createServer(app);

var io = require('socket.io').listen(server);

app.get('/', function(req, res){
    res.sendfile('index.html')
});

app.get(/^(.+)$/, function(req, res){
    console.log('static file request: ' + req.params);
    res.sendfile(__dirname + req.params[0]);
});

var gameStates = (function(){
    var games = [];

    var getNames = function(){
        for(gameIndex in games){
            if(gameHasSlotFree(games[gameIndex])){
                var name = occupyGame(games[gameIndex]);
                return {name: name, game: games[gameIndex]}
            }
        }
        // No free game found, create one
        var new_game = {name: games.length, players: [0], bot: 0};
        games.push(new_game);
        return {name: 0, game: new_game}
    };

    var getGamePlayers = function(gameIndex){
        return games[gameIndex].players
    }

    // Decide if a given game still has a free player slot
    var gameHasSlotFree = function(game){
        if( (game.players.indexOf(0) == -1) || (game.players.indexOf(1) == -1) ){
            return true;
        } else {
            return false;
        }
    }

    // Occupy a place in a game. This assumes there is a slot available
    var occupyGame = function(game){
        if(game.players.indexOf(0) == -1){
            game.players.push(0);
            return 0;
        } else {
            game.players.push(1);
            return 1;
        }
    }

    var addBot = function(game_name){
        occupyGame(games[game_name]);
        games[game_name].bot = 1;
    }

    // Called when a player leaves a game
    var leaveGame = function(game, player){
        games[game].players.splice(games[game].players.indexOf(player),1);
        if(games[game].bot == 1){
            games[game].players = [];
            games[game].bot = 0;
        }
    }

    return {
        getNames: getNames,
        leaveGame: leaveGame,
        getGamePlayers: getGamePlayers,
        addBot: addBot
    };
}());

var BrainPool = (function(){
    var brain = require('./js/brain.js');
    var brains = [];
    var nr_brains = 10;
    var genomes = [];
    for(var i=0; i<nr_brains; i++){
        genomes[i] = new brain.Genome();
        genomes[i].random_generation(49, [ [49, true, 5, 5, 5], [7, false, 5, 5, 5] ]);
        brains[i] = new brain.Brain();
        brains[i].initialize(genomes[i].weights);
    }

    var getBrains = function(){
        return brains;
    }

    return {
        getBrains: getBrains
    }
}());


io.sockets.on('connection', function(socket){
    var names = gameStates.getNames();
    var brains = BrainPool.getBrains();

    socket.emit('init', {
        name: names.name,
        game_name: names.game.name,
        players: names.game.players
    });

    socket.broadcast.emit('user:join', {
        name: names.name,
        game_name: names.game.name,
        players: gameStates.getGamePlayers(names.game.name)
    });

    socket.on('move', function(data){
        socket.broadcast.emit('move', data);
    });

    socket.on('bot:joined', function(data){
        gameStates.addBot(data.game_name);
    });

    socket.on('disconnect', function(){
        gameStates.leaveGame(names.game.name, names.name);
        socket.broadcast.emit('user:left', {
            name: names.name,
            game_name: names.game.name,
            players: gameStates.getGamePlayers(names.game.name)
        });
    });
});

server.listen(3000, function(){
    console.log('Listening on port 3000');
});
