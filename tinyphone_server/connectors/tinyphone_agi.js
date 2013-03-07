/**
 * The very simple protocol has 3 attributes:
 * id = unique id for call
 * event = event name
 * value = depends on event type.
 * three attributes are comma delimted, name and value are colon delimited.
 * message is CR delimited.
 * There are 4 event types- new_call, keypress, audio_level, and hangup:
 * id:133238984.24,event:new_call,value:16466429290|13605551212|(optional args, pipe delimited)
 * id:133238984.24,event:keypress,value:*
 * id:133238984.24,event:audio_level,value:56
 * id:133238984.24,event:hangup,value:0
 */
var sys = require('sys');
var events = require('events');
var agi_net = require('net');
var agiBuffer = "";
var callers = {};

function TinyphoneAGI() {
    if (this instanceof TinyphoneAGI === false) {
        return new TinyphoneAGI();
    }
    events.EventEmitter.call(this);
}

sys.inherits(TinyphoneAGI, events.EventEmitter);

TinyphoneAGI.prototype.start = function(agi_host, agi_port) {
    var self = this;
    agi_net.createServer(function(sock) {
        sock.setEncoding('ascii');
        var remoteAddress = sock.remoteAddress;
        var remotePort = sock.remotePort;
        // We have a connection - a socket object is assigned to the connection automatically
        console.log('CONNECTED AGI CLIENT: ' + remoteAddress + ':' + remotePort);

        // Add a 'data' event handler to this instance of socket
        sock.on('data', function(data) {
            for (var i = 0; i < data.length; i++) {
                if (data.charAt(i) == '\n') {
                    handleMessage(agiBuffer);
                    agiBuffer = "";
                }
                else {
                    agiBuffer = agiBuffer + data.charAt(i);
                }
            }

            function handleMessage(buf) {
                var attr = buf.split(',');
                var message = {};
                for (var i = 0; i < attr.length; i++) {
                    var nameValue = attr[i].split(':');
                    message[nameValue[0]] = nameValue[1];
                }
                switch (message.event) {
                case "new_call":
                    newCaller(message);
                    break;
                case "keypress":
                    keyPress(message);
                    break;
                case "audio_level":
                    audioLevel(message);
                    break;
                case "hangup":
                    hangup(message);
                    break;
                default:
                    console.log('UNKNOWN MESSAGE: ' + JSON.stringify(message));
                    break;
                }
                //    console.log('DATA ' + sock.remoteAddress + ': ' + JSON.stringify(message));
            }

            function newCaller(message) {
                var phoneNumbersAndArgs = message.value.split("|");
                var arg = [];
                for (var i = 2; i < phoneNumbersAndArgs.length; i++) {
                    arg.push(phoneNumbersAndArgs[i]);
                }
                var caller = {
                    id: message.id,
                    callerNumber: phoneNumbersAndArgs[0],
                    numCalled: phoneNumbersAndArgs[1],
                    args: arg
                };
                //console.log("new caller! " + JSON.stringify(caller));
                caller["socket"] = sock;
                callers[caller.id] = caller;
                //rebuild the value with the caller's number and any args
                var newCallValue = phoneNumbersAndArgs[0];
                if (arg.length > 0) {
                    newCallValue = newCallValue + "|" + arg.join("|");
                }
                message.value = newCallValue;
                sendRemote(message, message.id);
            }

            function keyPress(message) {
                sendRemote(message, message.id);
                //console.log("key press! " + JSON.stringify(message));   
            }

            function audioLevel(message) {
                sendRemote(message, message.id);
                //console.log("audio level! " + JSON.stringify(message));   
            }

            function hangup(message) {
                var caller = callers[message.id];
                caller.socket.destroy();
                sendRemote(message, message.id);
                delete callers[message.id];
                //console.log("hangup! " + JSON.stringify(message));
            }

            function sendRemote(message, caller_uid) {
               // var msgString = JSON.stringify(message);
                var caller = callers[caller_uid];
                self.emit("agi_event", message, caller);
            }

        });

        // Add a 'close' event handler to this instance of socket
        sock.on('close', function(data) {
            console.log('CLOSED AGI CLIENT: ' + remoteAddress + ' ' + remotePort);
        });

    }).listen(agi_port, agi_host);
    console.log('Server listening for AGI connections on ' + agi_host +':'+ agi_port);
}

exports.TinyphoneAGI = TinyphoneAGI;
