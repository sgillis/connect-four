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
    var simulation_count = 0;
    var wins = [];
    var fitness = [];
    for(var i=0; i<nr_brains; i++){
        genomes[i] = new brain.Genome();
        genomes[i].random_generation(49, [
            { nr_neurons: 49,
              feedbacks: true,
              max_weight: 5,
              max_mu: 5,
              max_sigma: 5
            },
            { nr_neurons: 7,
              feedbacks: false,
              max_weight: 5,
              max_mu: 5,
              max_sigma: 5
            }
        ]);
        brains[i] = new brain.Brain();
        brains[i].initialize(genomes[i].dna);
    }

    var getBrains = function(){
        return brains;
    }

    var getBestBrain = function(){
        var best_fitness = 0,
            index = 0;
        for(var i=0; i<fitness.length; i++){
            if(fitness[i]>best_fitness){
                best_fitness = fitness[i];
                index = i;
            }
        }
        console.log('returning brain ' + index);
        return brains[index];
    }

    var increaseSimulationCount = function(){
        simulation_count += 1;
        return simulation_count;
    }

    var resetSimulationCount = function(){
        simulation_count = 0;
        return simulation_count;
    }

    var processWorkerResult = function(worker_wins){
        for(var i=0; i<worker_wins.length; i++){
            x = wins[i] || 0;
            wins[i] = x + worker_wins[i];
        }
        increaseSimulationCount()
        if(simulation_count==(nr_brains - 1)){
            console.log('generation complete');
            generationComplete();
        }
    }

    var resetWins = function(){
        console.log(wins);
        wins = [];
    }

    var replaceWorstBrain = function(){
        var min_nr_wins = Math.exp(nr_brains, 2),
            index = -1;
        for(var i=0; i<wins.length; i++){
            if(wins[i]<min_nr_wins){
                min_nr_wins = wins[i];
                index = i;
            }
        }
    }

    var calculateFitness = function(){
        var total = 0;
        for(var i=0; i<wins.length; i++){
            total += wins[i];
        }
        for(var i=0; i<wins.length; i++){
            fitness[i] = wins[i]/total;
        }
    }

    var generationComplete = function(){
        calculateFitness();
        replaceWorstBrain();
        resetSimulationCount();
        resetWins();
    }

    return {
        getBrains: getBrains,
        getBestBrain: getBestBrain,
        getNrBrains: function(){ return nr_brains; },
        getSimulationCount: function(){ return simulation_count; },
        processWorkerResult: processWorkerResult
    }
}());

io.set('log level', 1);

io.sockets.on('connection', function(socket){
    var names = gameStates.getNames();
    var brains = BrainPool.getBrains();

    socket.emit('init', {
        name: names.name,
        game_name: names.game.name,
        players: names.game.players,
        fighters: BrainPool.getBrains(),
        simulation_count: BrainPool.getSimulationCount()
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

    socket.on('worker:result', function(data){
        BrainPool.processWorkerResult(data.result);
        socket.emit('worker:new_data', {
            simulation_count: BrainPool.getSimulationCount()
        });
    });

    socket.on('disconnect', function(){
        gameStates.leaveGame(names.game.name, names.name);
        socket.broadcast.emit('user:left', {
            name: names.name,
            game_name: names.game.name,
            players: gameStates.getGamePlayers(names.game.name)
        });
    });

    socket.on('request:bot', function(){
        brain = BrainPool.getBestBrain()
        socket.emit('receive:bot', {
            brain: brain
        });
    });
});

server.listen(3000, function(){
    console.log('Listening on port 3000');
});
