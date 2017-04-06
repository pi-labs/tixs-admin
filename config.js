var fs = require('fs');


var config = {};

config.mqttOptions ={
    key: fs.readFileSync("app/keys/dac94b8383-private.pem.key"),
    cert: fs.readFileSync("app/keys/dac94b8383-certificate.pem.crt"),
    rejectUnauthorized: false

};

config.mqttHost = "mqtts://a1f460knl3ti3i.iot.eu-west-1.amazonaws.com:8883";
config.mqttStartupFilter = "t/+/start";


config.mongoURL = 'mongodb://localhost/tixs';
config.mongoOptions = {config: {autoIndex: false}};


module.exports = config;
