var config = require('config');
var redis = require('redis');
var client = redis.createClient();
var url = require('url');
var request = require('request');

var redisPrefix = (config.has('redisPrefix') ? config.get('redisPrefix') : 'mockingbird') + ':';

function proxyRequest(req, callback) {
  let href = config.get('sites.' + req.mockingbird.site + '.host') + '/' 
    + req.mockingbird.path.split('/').slice(2).join('/');

  // filter request headers
  let headers = req.headers;
  delete headers.host;
  if (config.has('sites.' + req.mockingbird.site + '.excludeRequestHeaders')) {
    for (let h of config.get('sites.' + req.mockingbird.site + '.excludeRequestHeaders')) {
      delete headers[h];
    }
  }

  let options = {
    headers: headers,
  }

  // proxy the request
  request[req.method.toLowerCase()](href, options , (error, response, body) => {
    callback(error, response, body);
  });
}

module.exports.middleware = function retrieve() {
  return function(req, res, next) {
    let parsedUrl = url.parse(req.originalUrl);
    req.mockingbird = {
      site: parsedUrl.path.split('/')[1],
      path: parsedUrl.path,
      key: redisPrefix + req.method + ' ' + parsedUrl.path
    }

    if (req.mockingbird.site && config.has('sites.' + req.mockingbird.site)) {
      if (config.has('sites.' + req.mockingbird.site + '.proxy') 
        && config.get('sites.' + req.mockingbird.site + '.proxy') == true) {

        proxyRequest(req, (error, response, body) => {
          let result = {
            statusCode: response.statusCode,
            headers: response.headers,
            body: body
          };

          console.log('! ' + req.method + ' ' + req.originalUrl);
          res.writeHead(result.statusCode, result.headers);
          res.write(result.body);
          res.end();
        });
      } else {
        client.get(req.mockingbird.key, (err, reply) => {
          if (reply) {
            let response = JSON.parse(reply);

            console.log(req.method + ' ' + req.originalUrl);
            res.writeHead(response.statusCode, response.headers);
            res.write(response.body);
            res.end();
          } else {
            proxyRequest(req, (error, response, body) => {
              let result = {
                statusCode: response.statusCode,
                headers: response.headers,
                body: body
              };

              client.set(req.mockingbird.key, JSON.stringify(result));

              console.log('! ' + req.method + ' ' + req.originalUrl);
              res.writeHead(result.statusCode, result.headers);
              res.write(result.body);
              res.end();
            });
          }
        });
      }
    } else {
      next();
    }
  }
}

module.exports.clear = function() {
  client.keys(redisPrefix + '*', function(err, keys) {
    console.log(keys);
    client.del(keys);
  });
}