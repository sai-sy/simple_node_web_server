/*
* Primary File for API
* 
*/

// Dependencies
var http = require('http');
var https = require('https')
var url = require('url');
var fs = require('fs');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var _data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers');
 


var httpServer = http.createServer(function(req, res){
  unifiedServer(req, res);
});

var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'), 
  'cert': fs.readFileSync('./https/cert.pem')



}


var httpsServer = https.createServer(httpsServerOptions, function(req, res){
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function(){
  console.log("The server is listening on port "+config.httpsPort+" in " +config.envName+" mode")
});

// this server should respond to all requests with a string
var unifiedServer = function(req, res){
    
    //Get URL then parse
    var parsedURL = url.parse(req.url,true);
    
    // get path from URL
    var path = parsedURL.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,'') // regex that takes out trailing and preceding '/'

    // Get HTTP Method
    var method = req.method.toLowerCase();

    // Get the query string as object
    var queryStringObject = parsedURL.query;

    // Get headers as object
    var headers = req.headers

    // Get the payload
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data)
    })
    req.on('end',function(){
        buffer += decoder.end();
        // choose handler for request,use not found if not found
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        
        //construct data object to send to handler
        var data = {
            "trimmedPath" : trimmedPath,
            "method" : method,
            "queryStringObject" : queryStringObject,
            "headers" : headers,
            "payload" : helpers.parseJsonToObject(buffer),
        }

        // route request to handler
        chosenHandler(data,function(statusCode, payload){
            // use the status code called back by the handler, or default to 200

            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            payload = typeof(payload) == 'object' ? payload : {}

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // return response
            res.setHeader('content-type','application/json');
            res.writeHead(statusCode);
            res.end(payloadString);
        
            console.log('Returning this response: ', statusCode,payloadString);
            
        
        });
    });
};

//start server and listen on port 3000
httpServer.listen(config.httpPort, function(){
    console.log("The server is listening on port "+config.httpPort+" in " +config.envName+" mode")
});



// define a req routers
var router = {
  'sample' : handlers.sample,
  'users' : handlers.users,
  'tokens' : handlers.tokens,
  'checks' : handlers.checks,
};
