var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://teletubbie.test.b2b.pixida.com');
var ProtoBuf = require("protobufjs");

var builder = ProtoBuf.loadProtoFile("tixs.proto");
var tixsMessages = builder.build();


client.on('connect', function () {
    console.log("Connected to Broker");
    client.subscribe('t/start');
    client.publish('presence', 'Hello mqtt');
});

client.on('message', function (topic, message) {
  // message is Buffer
  msg = tixsMessages.telematik.Startup.decode(message);
  console.log(msg.getImei());

});