var config = require('config');
var connect = require('connect');
var http = require('http');

var app = connect();

var bodyParser = require('body-parser');
var mockingbird = require('./mockingbird');

// configure middlewares
app.use('/~clear', function fooMiddleware(req, res) {
    mockingbird.clear();
    res.end('success!');
});

app.use(bodyParser.urlencoded({extended: false}));
app.use(mockingbird.middleware());
app.use(function(req, res){
    res.writeHead(404, {});
    res.end('not found!');
});



//create node.js http server and listen on port
http.createServer(app).listen(config.has('port') ? config.get('port') : 3000);