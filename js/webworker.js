importScripts('./utils.js')
importScripts('./brain.js')

onmessage = function(work){ 
    var bot1 = new FighterBot(work.data[0].genome)
    var bot2 = new FighterBot(work.data[1].genome)
    var games = [];
    var nr_games = 10;
    var wins = {
        1: 0,
        2: 0
    }

    for(var i=0; i<nr_games; i++){
        games[i] = new Game();
        while(
                fourConnected(games[i].pieces[games[i].active_player]) !== true &&
                fourConnected(games[i].pieces[(games[i].active_player + 1) % 2]) !== true
        ){
            if(games[i].active_player == 0){
                bot1.move(games[i]);
            } else {
                bot2.move(games[i]);
            }
            games[i].active_player = (games[i].active_player + 1) % 2;
        }
        if(fourConnected(games[i].pieces[0])){
            wins[1] += 1;
        } else {
            wins[2] += 1;
        }
    }

    postMessage({
        1: {
            'fought': nr_games,
            'won': wins[1]
        },
        2: {
            'fought': nr_games,
            'won': wins[2]
        }
    });
};

function FighterBot(genome){
    this.brain = new brain.Brain();
    this.brain.initialize(genome);

    this.random_move = function(game){
        var made_move = false;
        while(made_move == false){
            var spot = availableSpot(Math.floor(Math.random() * 7), 0, game.pieces);
            if(spot[1] > -1){
                // Make move locally
                game.pieces[game.active_player].push(spot);
                made_move = true;
            }
        }
    }
    
    this.move = function(game){
        this.brain.process(piecesArray(game.pieces));
        var largest = Math.max.apply(Math, this.brain.output);
        var position = indexOfArr(this.brain.output, largest);
        var spot = availableSpot(position, 0, game.pieces);
        if(spot[1] > -1){
            // Make move locally
            game.pieces[game.active_player].push(spot);
        } else {
            // Make random move
            this.random_move(game)
        }
    }
}

function Game(){
    this.pieces = [[], []];
    this.active_player = 0;
}

function print_game(game){
    for(var j=0; j<7; j++){
        line = '';
        for(var i=0; i<7; i++){
            if(indexOfArr(game.pieces[0], [i, j]) > -1){
                line += '1 ';
            } else if(indexOfArr(game.pieces[1], [i, j]) > -1 ){
                line += '2 ';
            } else {
                line += '0 ';
            }
        }
        console.log(line);
    }
    if(fourConnected(game.pieces[0])){
        console.log('bot 1 won');
    } else {
        console.log('bot 2 won');
    }
}
