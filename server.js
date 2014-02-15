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
    var nr_brains = 20; // Should be at least more than 16
    var genomes = [];
    var simulation_count = 0;
    var wins = [];
    var fitness = [];
    var nr_inputs = 49;
    var layers = [
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
    ];
    var gmax = new brain.Genome();
    var gmin = new brain.Genome();
    gmax.max_generation(nr_inputs, layers);
    gmin.min_generation(nr_inputs, layers);
    for(var i=0; i<nr_brains; i++){
        genomes[i] = new brain.Genome();
        genomes[i].random_generation(nr_inputs, layers);
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
        wins = [];
    }

    var sortFitnessWorstToBest = function(){
        // Returns an array of indices. The first index will be the brain with
        // the worst fitness score, the second the brain with the second worst
        // fitness etc.
        var result = [];
        for(var i=0; i<wins.length; i++){
            if(wins[result[0]]>wins[i]){
                result.splice(0, 0, i);
                continue;
            }
            for(var j=0; j<result.length - 1; j++){
                if(wins[result[j]] < wins[i]){
                    if(wins[i] <= wins[result[j+1]]){
                        result.splice(j+1, 0, i);
                        break;
                    }
                }
            }
            if(result.length==i){
                result.push(i);
            }
        }
        return result;
    }

    var replaceWorstBrain = function(){
        var brainOrder = sortFitnessWorstToBest();
        // Generate some new brains. To do this we choose two brains by first
        // choosing a random number r in [0, 1]. Then we choose the bot[i] for
        // which sum_fitness[i-1] < r < sum_fitness[i]. sum_fitness[i] is the
        // sum of all fitness values for index lower than i, thus
        //   
        //   sum_fitness[2] = fitness[0] + fitness[1] + fitness[2]
        //
        // and sum_fitness[-1] = 0. We do the same for finding the second
        // brain, except that it cannot be the same as the first brain.
        var r = Math.random(),
            index1 = -1,
            sum_fitness = 0;
        for(var i=0; i<fitness.length; i++){
            if(sum_fitness < r < (sum_fitness + fitness[i])){
                index1 = i;
                break;
            } else {
                sum_fitness += fitness[i];
            }
        }
        // Find second brain
        var index2 = -1;
        while(index2 == -1){
            r = Math.random();
            sum_fitness = 0;
            for(var i=0; i<fitness.length; i++){
                if(sum_fitness < r < (sum_fitness + fitness[i])){
                    if(i != index1){
                        index2 = i;
                        break;
                    }
                } else {
                    sum_fitness += fitness[i];
                }
            }
        }
        // Create some offspring
        var offspring = genomes[index1].mate(genomes[index2], gmax, gmin);
        var offspring_array = [
            offspring.os1,
            offspring.os2,
            offspring.os3,
            offspring.os4,
            offspring.nos11,
            offspring.nos12,
            offspring.nos13,
            offspring.nos21,
            offspring.nos22,
            offspring.nos23,
            offspring.nos31,
            offspring.nos32,
            offspring.nos33,
            offspring.nos41,
            offspring.nos42,
            offspring.nos43
        ];
        for(var i=0; i<16; i++){
            genomes[brainOrder[i]] = offspring_array[i];
            brains[i] = new brain.Brain();
            brains[i].initialize(genomes[i].dna);
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
