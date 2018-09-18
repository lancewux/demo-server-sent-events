module.exports = eventStream;

var parse = require('url').parse;

var pathMatch = function (url, path) {
  try {
    return parse(url).pathname === path;
  } catch (e) {
    return false;
  }
}

function eventStream(opts) {
  opts = opts || {};
  opts.log = typeof opts.log == 'undefined' ? console.log.bind(console) : opts.log;
  opts.path = opts.path || '/__webpack_hmr';
  opts.heartbeat = opts.heartbeat || 10 * 1000;

  var eventStream = createEventStream(opts.heartbeat);
  var middleware = function (req, res, next) {
    if (!pathMatch(req.url, opts.path)) return next();
    eventStream.handler(req, res);
    // publishStats("sync", eventStream);
  };
  setInterval(function () {
    publishStats("built", eventStream);
  }, 5 * 1000).unref();

  middleware.publish = eventStream.publish;
  return middleware;
}

function createEventStream(heartbeat) {
  var clientId = 0;
  var clients = {};
  function everyClient(fn) {
    Object.keys(clients).forEach(function (id) {
      fn(clients[id]);
    });
  }
  setInterval(function heartbeatTick() {
    everyClient(function (client) {
      client.write("data: \uD83D\uDC93\n\n");
    });
  }, heartbeat).unref();
  return {
    handler: function (req, res) {
      var headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/event-stream;charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        // While behind nginx, event stream should not be buffered:
        // http://nginx.org/docs/http/ngx_http_proxy_module.html#proxy_buffering
        'X-Accel-Buffering': 'no'
      };

      var isHttp1 = !(parseInt(req.httpVersion) >= 2);
      console.log('isHttp1', isHttp1, req.httpVersion);
      if (isHttp1) {
        req.socket.setKeepAlive(true);
        Object.assign(headers, {
          'Connection': 'keep-alive',
        });
      }

      res.writeHead(200, headers);
      res.write('\n');
      var id = clientId++;
      clients[id] = res;
      req.on("close", function () {
        console.log('req on close');
        delete clients[id];
      });
    },
    publish: function (payload) {
      everyClient(function (client) {
        client.write("data: " + JSON.stringify(payload) + "\n\n");
      });
    }
  };
}

function publishStats(action, eventStream) {
  eventStream.publish({
    name: 'nameStats',
    action: action,
    time: new Date().getTime(),
    hash: 'abcdegagf',
    warnings: [],
    errors: [],
    modules: []
  });
}