var agi_net = require('net');
var remote_net = require('net');
var io = require('socket.io').listen(12003);
var REMOTE_PORT=12002;

var AGI_HOST = '127.0.0.1';
var AGI_PORT = 12001;
//reduce verbosity on socket.io
io.set('log level', 1);
/**
 * The very simple protocol has 3 attributes:
 * id = unique id for call
 * event = event name
 * value = depends on event type.
 * three attributes are comma delimted, name and value are colon delimited.
 * message is CR delimited.
 * There are 4 event types- new_call, keypress, audio_level, and hangup:
 * id:133238984.24,event:new_call,value:16466429290
 * id:133238984.24,event:keypress,value:*
 * id:133238984.24,event:audio_level,value:56
 * id:133238984.24,event:hangup,value:0
*/

/**
 *Remote clients can only receive data.
 * The only event that they can send is a CONNECT message
 * Message has 4 atrributes: CONNECT,a unique ID, phone number,NULL or CR.
 * The NULL/CR attribute sets the "stop byte" for messages sent to client.
 * CONNECT,UNIQUEID123456,16468385747,NULL
 */
var agiBuffer = "";
var remoteBuffer="";
var callers = {};
//remote screens or physical objects
var remoteClients = {};
//remote screens or physical objects
var webClients = {};
remote_net.createServer(function(sock){
  sock.setEncoding('ascii');
  console.log('CONNECTED REMOTE CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
      // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        var remoteKey = sock.remoteAddress+":"+sock.remotePort;
        delete remoteClients[remoteKey];
        console.log('CLOSED REMOTE CLIENT: ' + remoteKey);
    });
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        for ( var i = 0; i < data.length; i++){
            //handle cr or null terminated byte
            if (data.charAt(i) == '\n' || data.charAt(i) == '\0'){
                handleMessage(remoteBuffer);
                remoteBuffer = "";
            } else {
                remoteBuffer = remoteBuffer + data.charAt(i);   
            }
        }
        function handleMessage(buf){
            var attr = buf.split(',');
            if (attr.length != 4 || attr[0] != "CONNECT"){
                console.log("malformed message from remote client: "+buf);
             return;   
            }
            var phone_number = attr[2];
            var uniqueid=attr[1];
            var term_byte = '\n';
            if (attr[3] == "NULL"){
                term_byte = '\0';
            }
            var remoteClient = { id:uniqueid,
                                 phoneNumber:phone_number, 
                                 termByte:term_byte
                                }
            remoteClient["socket"]=sock;
            var remoteKey = sock.remoteAddress+":"+sock.remotePort;
            remoteClients[remoteKey] = remoteClient;
         console.log(buf);   
        }
        
    });
}).listen(REMOTE_PORT);
console.log('Server listening for remote connections on ' + REMOTE_PORT);

agi_net.createServer(function(sock) {
    sock.setEncoding('ascii');
    
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED AGI CLIENT: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        for ( var i = 0; i < data.length; i++){
            if (data.charAt(i) == '\n'){
                handleMessage(agiBuffer);
                agiBuffer = "";
            } else {
                agiBuffer = agiBuffer + data.charAt(i);   
            }
        }
        function handleMessage (buf){
            var attr = buf.split(',');
            var message = {};
            for (var i = 0; i < attr.length; i++){
                   var nameValue = attr[i].split(':');
                   message[nameValue[0]] = nameValue[1];
            }
            switch(message.event){
             case "new_call": newCaller(message); break;
             case "keypress": keyPress(message); break;
             case "audio_level": audioLevel(message); break;
             case "hangup": hangup(message); break;
             default: console.log('UNKNOWN MESSAGE: ' + JSON.stringify(message)); break;
            }
            //console.log('DATA ' + sock.remoteAddress + ': ' + JSON.stringify(message));
        }
        function newCaller(message){
            var phoneNumbers=message.value.split("|");
            var caller = {  id:message.id,
                            callerNumber:phoneNumbers[0],
                            numCalled:phoneNumbers[1] };
            console.log("new caller! " + JSON.stringify(caller));
            caller["socket"] = sock;
            callers[caller.id]=caller;
            message.value = phoneNumbers[0];
            sendRemote(message,message.id);
        }
        function keyPress(message){
            sendRemote(message,message.id);
            //console.log("key press! " + JSON.stringify(message));   
        }
        function audioLevel(message){
            sendRemote(message,message.id);
            //console.log("audio level! " + JSON.stringify(message));   
        }
        function hangup(message){
            var caller = callers[message.id];
            caller.socket.destroy();
            sendRemote(message,message.id);
            delete callers[message.id];
            //console.log("hangup! " + JSON.stringify(message));
        }
        
        function sendRemote(message, caller_uid){
            var msgString = JSON.stringify(message);
          caller = callers[caller_uid];
          //send net clients
          for (key in remoteClients){
            remoteClient = remoteClients[key];
            if (caller.numCalled == remoteClient.phoneNumber){
                remoteClient.socket.write(msgString+remoteClient.termByte);
            }
          }
          //send socket.io clients
        io.sockets.emit(message.event, message);
        }
        
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED AGI CLIENT: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    
}).listen(AGI_PORT, AGI_HOST);
//set up socket.io
io.sockets.on('connection', function (socket) {
  socket.on('setup', function(info) {
    console.log("just got setup info: "+JSON.stringify(info));
  });
  socket.on('disconnect', function() {
    console.log("socket.io client disconnected");
  });
});

console.log('Server listening for AGI connections on ' + AGI_HOST +':'+ AGI_PORT);