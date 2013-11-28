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

server.listen(3000, function(){
    console.log('Listening on port 3000');
});
