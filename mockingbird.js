var config = require('config');
var redis = require('redis');
var client = redis.createClient();
var url = require('url');
var request = require('request');

const store = (route, result) => {
  let expiry = 60 * 60 * 24; // 24h
  if (config.has('sites.' + route.site + '.expiry')) {
    expiry = config.get('sites.' + req.site + '.expiry');
  }

  client.set(route.key, JSON.stringify(result), 'EX', expiry);
};

const proxy = (route, res, next) => {
  // filter request headers
  let headers = route.headers;
  delete headers.host;
  if (config.has('sites.' + route.site + '.excludeRequestHeaders')) {
    for (let h of config.get('sites.' + route.site + '.excludeRequestHeaders')) {
      delete headers[h];
    }
  }

  let options = {
    url: route.url,
    method: route.method,
    headers: headers,
    forever: true,
  }

  // TODO: replace with http
  // agent = new http.Agent()
  // agent.maxSockets = 1000000
  // http.request({agent:agent})
  request(options, (error, response, body) => {
    if (error) {
      console.log(error);
      next();
    } else {
      let result = {
        statusCode: response.statusCode,
        headers: response.headers,
        body: body,
      };

      // send response
      console.log('! ' + route.method + ' ' + route.url);
      res.writeHead(result.statusCode, result.headers);
      res.write(result.body);
      res.end();

      // call next chain (cache)
      store(route, result);
    }
  });
};

const retrieve = (route, res, next) => {
  client.get(route.key, (error, reply) => {
    if (error) {
      console.log(error);
      next();
    } else if (reply) {
      let response = JSON.parse(reply);

      console.log(route.method + ' ' + route.url);
      res.writeHead(response.statusCode, response.headers);
      res.write(response.body);
      res.end();
    } else {
      proxy(route, res, next);
    }
  });
};

const router = (req, res, next) => {
  let parsedUrl = url.parse(req.originalUrl);
  let site = parsedUrl.path.split('/')[1];

  if (site && config.has('sites.' + site)) {
    const REDIS_PREFIX = (config.has('redisPrefix') ? config.get('redisPrefix') : 'mockingbird') + ':';
    
    let path = parsedUrl.path;
    let key = REDIS_PREFIX + site + ' ' + req.method + ' ' + parsedUrl.path;
    let url = config.get('sites.' + site + '.host') + '/' 
      + path.split('/').slice(2).join('/');

    retrieve({
      site,
      path,
      key,
      url,
      method: req.method.toLowerCase(),
      headers: req.headers,
    }, res, next);
  } else {
    next();
  }
};

module.exports.sing = () => {
  return router;
};