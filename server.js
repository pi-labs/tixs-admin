var mqtt = require('mqtt');
var client  = mqtt.connect('mqtt://teletubbie.test.b2b.pixida.com');

client.on('connect', function () {
    console.log("Connected to Broker");
    client.subscribe('t/start');
    client.publish('presence', 'Hello mqtt');
});


client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString());
});