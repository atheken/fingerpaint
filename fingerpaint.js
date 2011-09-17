(function() {
  var app, config, express, io, randomColor, socketio, sys, users;
  sys = require('sys');
  express = require('express');
  socketio = require('socket.io');
  config = {
    port: process.env.PORT || 3000,
    publicDir: 'public'
  };
  app = express.createServer();
  app.use(express.compiler({
    src: 'src',
    dest: config.publicDir,
    enable: ['coffeescript']
  }));
  app.use(express.static(config.publicDir));
  app.listen(config.port, function() {
    var addr;
    addr = app.address();
    return sys.puts("[fingerpaint] listening on http://" + addr.address + ":" + addr.port);
  });
  randomColor = function() {
    return "" + (Math.floor(Math.random() * 128 + 32)) + "," + (Math.floor(Math.random() * 128 + 32)) + "," + (Math.floor(Math.random() * 128 + 32));
  };
  io = socketio.listen(app);
  io.set('log level', 0);
  users = {};
  io.sockets.on('connection', function(socket) {
    var user;
    sys.puts("[fingerpaint] user " + socket.id + " connected");
    user = {
      id: socket.id,
      nick: socket.id,
      color: randomColor()
    };
    users[socket.id] = user;
    socket.json.emit('hello', user, users);
    socket.broadcast.json.emit('join', user);
    socket.on('move', function(position, drawing) {
      return io.sockets.json.emit('move', socket.id, position, drawing);
    });
    socket.on('nick', function(nick) {
      user.nick = nick;
      return io.sockets.json.emit('nick', socket.id, nick);
    });
    return socket.on('disconnect', function() {
      delete users[socket.id];
      socket.broadcast.emit('part', user);
      return sys.puts("[fingerpaint] user " + socket.id + " disconnected");
    });
  });
}).call(this);
