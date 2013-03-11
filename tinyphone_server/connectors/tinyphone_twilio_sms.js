var http = require('http'),
    path = require('path'),
    util = require('util'),
    net = require('net');

var sys = require('sys');
var events = require('events');
var qs = require('querystring');
var smsIdCounter = 0;
function TinyphoneTwilioSMS() {
    if (this instanceof TinyphoneTwilioSMS === false) {
        return new TinyphoneTwilioSMS();
    }
    events.EventEmitter.call(this);
}

sys.inherits(TinyphoneTwilioSMS, events.EventEmitter);

TinyphoneTwilioSMS.prototype.start = function(port, sms_response) {
    var self = this;
    var server = http.createServer(function(req, res) {
        if (req.url == '/incoming' && req.method == 'POST') {
            smsIdCounter ++;
            var uniqueID = ""+Math.round(new Date().getTime()/1000)+"."+smsIdCounter;
            console.log("message incoming!");
            var body = '';
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                console.log("http data = " + body);
                var sms_data = qs.parse(body);
                // Extract the From and Body values from the POST data
                var message = sms_data.Body;
                var from = sms_data.From;
                var to = sms_data.To;
                var messageAsURI = encodeURIComponent(message.toString('utf8')).replace("|", "%7C").replace(",", "%2C");
                var messageObj = {
                    event: "sms",
                    id: uniqueID,
                    value: from.replace("+", "")+"|"+messageAsURI
                }
                var caller = {
                    id: messageObj.id,
                    callerNumber: from.replace("+", ""),
                    numCalled: to.replace("+", ""),
                };
                console.log('From: ' + caller.callerNumber + ', Message: ' + JSON.stringify(messageObj));
                self.emit("sms_event", messageObj, caller);
                // Return sender a very nice message
                // twiML to be executed when SMS is received
                if (sms_response != null) {
                    res.writeHead(200, {
                        'Content-Type': 'text/xml'
                    });
                    var twiml = '<Response><Sms>' + sms_response + '</Sms></Response>';
                    res.end(twiml);
                } else {
                    res.writeHead(200);
                    res.end("");
                }

            });
        } else {
            res.writeHead(502);
            res.end("");
        }

    });
    server.listen(port, function() {
        console.log('HTTP Server running at port ' + port);
    });
}

exports.TinyphoneTwilioSMS = TinyphoneTwilioSMS;