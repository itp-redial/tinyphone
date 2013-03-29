var sys = require('sys');
var events = require('events');
var remote_net = require('net');

/**
 *Remote clients can only receive data.
 * The only event that they can send is a CONNECT message
 * Message has 4 atrributes: CONNECT,a unique ID, phone number,NULL or CR.
 * The NULL/CR attribute sets the "stop byte" for messages sent to client.
 * CONNECT,UNIQUEID123456,16468385747,NULL
 */

//remote screens or physical objects
var remoteClients = {};

function TinyphoneNet() {
    if (this instanceof TinyphoneNet === false) {
        return new TinyphoneNet();
    }
    events.EventEmitter.call(this);
}

sys.inherits(TinyphoneNet, events.EventEmitter);

TinyphoneNet.prototype.start = function(net_port) {
    var self = this;
    remote_net.createServer(function(sock) {
    	var remoteBuffer = "";
        sock.setEncoding('ascii');
        var remoteAddress = sock.remoteAddress;
        var remotePort = sock.remotePort;
        console.log('CONNECTED REMOTE CLIENT: ' + remoteAddress + ':' + remotePort);
        // Add a 'close' event handler to this instance of socket
        sock.on('close', function(data) {
            var remoteKey = remoteAddress + ":" + remotePort;
            delete remoteClients[remoteKey];
            console.log('CLOSED REMOTE CLIENT: ' + remoteKey);
        });

        // Add a 'data' event handler to this instance of socket
        sock.on('data', function(data) {
            for (var i = 0; i < data.length; i++) {
                //handle cr or null terminated byte
                if (data.charAt(i) == '\n' || data.charAt(i) == '\0') {
                    handleMessage(remoteBuffer);
                    remoteBuffer = "";
                }
                else {
                    remoteBuffer = remoteBuffer + data.charAt(i);
                }
            }

            function handleMessage(buf) {
                var attr = buf.split(',');
                if (attr.length != 4 || attr[0] != "CONNECT") {
                    console.log("malformed message from remote client: " + buf);
                    return;
                }
                var phone_number = attr[2];
                var uniqueid = attr[1];
                var term_byte = '\n';
                if (attr[3] == "NULL") {
                    term_byte = '\0';
                }
                var remoteClient = {
                    id: uniqueid,
                    phoneNumber: phone_number,
                    termByte: term_byte
                }
                remoteClient["socket"] = sock;
                var remoteKey = remoteAddress + ":" + remotePort;
                remoteClients[remoteKey] = remoteClient;
                console.log(buf);
            }

        });
    }).listen(net_port);
    console.log('Server listening for remote connections on ' + net_port);
}

TinyphoneNet.prototype.send = function(caller, message) {
    var msgString = JSON.stringify(message);
    //send net clients
    for (var key in remoteClients) {
        var remoteClient = remoteClients[key];
        if (caller.numCalled == remoteClient.phoneNumber) {
            remoteClient.socket.write(msgString + remoteClient.termByte);
        }
    }
}

exports.TinyphoneNet = TinyphoneNet;