var sys = require('sys');
var events = require('events');
var io = null;
function TinyphoneWeb() {
	if (this instanceof TinyphoneWeb === false) {
		return new TinyphoneWeb();
	}
	events.EventEmitter.call(this);
}

sys.inherits(TinyphoneWeb, events.EventEmitter);

TinyphoneWeb.prototype.start = function(web_port) {
	io = require('socket.io').listen(web_port);
    io.sockets.on('connection', function(socket) {
    	socket.on('setup', function(info) {
    		socket.join(info.phoneNumber);
            console.log("just got setup info: " + JSON.stringify(info));
        });
    	socket.on('disconnect', function() {
    		console.log("socket.io client disconnected");
    	});
    });
    console.log("Server listening for remote Web socket.io connections on "+web_port);
}

TinyphoneWeb.prototype.send = function(caller, message) {
	if (message.event == 'audio_level') {
		clients = io.sockets.adapter.rooms[caller.numCalled];
		for (var clientId in clients ) {
  			//console.log('client: %s', clientId); //Seeing is believing 
  			var socket = io.sockets.connected[clientId];
  			socket.volatile.emit(message.event, message);
  		}
  	}	else {
  		io.to(caller.numCalled).emit(message.event, message);
  	}
}

  exports.TinyphoneWeb = TinyphoneWeb;
