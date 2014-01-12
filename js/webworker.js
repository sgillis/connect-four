importScripts('./utils.js')
importScripts('./brain.js')

onmessage = function(work){ 
    console.log('First fighter: ' + work.data[0]);
    console.log('Second fighter: ' + work.data[1]);

    var bot1 = new FighterBot(work.data[0])
    var bot2 = new FighterBot(work.data[1])
    var games = [];

    for(var i=0; i<100; i++){
        console.log('New game starting');
        games[i] = new Game();
        while(
                fourConnected(games[i].pieces[games[i].active_player]) !== true ||
                fourConnected(games[i].pieces[(games[i].active_player + 1) % 2]) !== true
        ){
            if(games[i].active_player == 0){
                bot1.move(games[i]);
            } else {
                bot2.move(games[i]);
            }
        }
        setTimeout(function(){}, 500);
    }

    postMessage('Done fighting');
};

function FighterBot(genome){
    this.brain = new brain.Brain();
    console.log(genome);
    this.brain.initialize(genome);

    this.random_move = function(game){
        var made_move = false;
        while(made_move == false){
            var spot = availableSpot(Math.floor(Math.random() * 7), 0, game.pieces);
            if(spot[1] > -1){
                // Make move locally
                console.log(spot);
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
            console.log(spot);
            game.pieces[game.active_player].push(spot);
        } else {
            // Make random move
            this.random_move()
        }
    }
}

function Game(){
    this.pieces = [[], []];
    this.active_player = 0;
}
