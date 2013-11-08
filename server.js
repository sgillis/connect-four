var express = require('express');
var app = express();

app.get('/', function(req, res){
    res.sendfile('index.html')
});

app.get(/^(.+)$/, function(req, res){
    console.log('static file request: ' + req.params);
    res.sendfile(__dirname + req.params[0]);
});

app.listen(3000, function(){
    console.log('Listening on port 3000');
});
