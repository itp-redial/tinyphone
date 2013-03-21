var config = require("./config.json");
var enable_net_connections = config.enable_net_connections || true;
var enable_web_connections = config.enable_web_connections || true;
var enable_agi_connections = config.enable_agi_connections || true;
var enable_sms_connections = config.enable_sms_connections || true;
var NET_PORT = config.net_port || 12002;
var WEB_PORT = config.web_port || 12003;
var AGI_HOST = config.agi_host || '127.0.0.1';
var AGI_PORT = config.agi_port || 12001;
var SMS_PORT = config.sms_port || 12004;
var SMS_RESPONSE = config.sms_response || null;
var version = "1.0b3";
console.log("TINYPHONE SERVER " + version);

if (enable_agi_connections) {
    var agi_net = require('./connectors/tinyphone_agi.js');
    var agi = new agi_net.TinyphoneAGI();
    agi.on('agi_event', function(message, caller) {
        if (enable_net_connections) {
            tp_net.send(caller, message);
        }
        if (enable_web_connections) {
            tp_web.send(caller, message);
        }
    });
    agi.start(AGI_HOST, AGI_PORT);
}

if (enable_sms_connections) {
    var sms_twilio = require("./connectors/tinyphone_twilio_sms.js");
    var sms = new sms_twilio.TinyphoneTwilioSMS();
    sms.on('sms_event', function(message, caller) {
        // console.log(JSON.stringify(message));
        // console.log(JSON.stringify(caller));
        if (enable_net_connections) {
            tp_net.send(caller, message);
        }
        if (enable_web_connections) {
            tp_web.send(caller, message);
        }
    });
    sms.start(SMS_PORT, SMS_RESPONSE);
}

if (enable_web_connections) {
    var web_io = require('./connectors/tinyphone_web.js');
    var tp_web = new web_io.TinyphoneWeb();
    tp_web.start(WEB_PORT);
}

if (enable_net_connections) {
    var net_io = require('./connectors/tinyphone_net.js');
    var tp_net = new net_io.TinyphoneNet();
    tp_net.start(NET_PORT);
}
