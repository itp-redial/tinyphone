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
    //set up socket.io
    io.enable('browser client minification'); // send minified client
    io.enable('browser client etag'); // apply etag caching logic based on version number
    io.enable('browser client gzip'); // gzip the file
    io.set('log level', 1); // reduce logging
    //set up socket.io
    io.sockets.on('connection', function(socket) {
        socket.on('setup', function(info) {
            socket.set('phoneNumber', info.phoneNumber, function() {});
            socket.set('id', info.id, function() {});
            console.log("just got setup info: " + JSON.stringify(info));
        });
        socket.on('disconnect', function() {
            console.log("socket.io client disconnected");
        });
    });
	console.log("Server listening for remote Web socket.io connections on "+web_port);
}

TinyphoneWeb.prototype.send = function(caller, message) {
    //send socket.io clients
    io.sockets.clients().forEach(function(socket) {
        socket.get('phoneNumber', function(err, phoneNumber) {
            if (phoneNumber == caller.numCalled) {
                if (message.event == 'audio_level') {
                    socket.volatile.emit(message.event, message);
                }
                else {
                    socket.emit(message.event, message);
                }
            }
            else {
                console.log("unknown screen for number " + caller.numCalled);
            }
        });
    });
}

exports.TinyphoneWeb = TinyphoneWeb;