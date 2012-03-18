var agi_net = require('net');
var remote_net = require('net');

var REMOTE_PORT=12002;

var AGI_HOST = '127.0.0.1';
var AGI_PORT = 12001;

/**
 * AGI will only send key presses, and that's it.
 * There's no identifying characteristics, just raw press events.
*/

/** Remote clients send no info to this server.
 * all they do is receive byte representations of digits.
 * (0-9, #, *) on the phone's keypad as ascii bytes*/

//remote screens or physical objects
var remoteClients = [];
remote_net.createServer(function(sock){
  console.log('CONNECTED REMOTE CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
  remoteClients.push(sock); //add client
      // Add a 'close' event handler to this instance of socket
    sock.on('close', function() {
        for(var i = 0; i < remoteClients.length; i++) {
            if(remoteClients[i] == sock) { //remove client
                remoteClients.splice(i,1);
                break;
            }
        }
        console.log('DISCONNECTED REMOTE CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
    });
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        for ( var i = 0; i < data.length; i++){
            handleByte(data[i]);
        }
        function handleByte(buf){
         console.log(buf);   
        }
        
    });
}).listen(REMOTE_PORT);
console.log('Server listening for remote connections on ' + REMOTE_PORT);

agi_net.createServer(function(sock){
  console.log('CONNECTED AGI CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
      // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED AGI CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
    });
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        console.log(data);
        //broadcast data to all remote clients
        for (var i = 0; i < remoteClients.length; i++){
            var client = remoteClients[i];
            client.write(data);
        }
    });
}).listen(AGI_PORT, AGI_HOST);

console.log('Server listening for AGI connections on ' + AGI_HOST +':'+ AGI_PORT);