var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://teletubbie.test.b2b.pixida.com');
var ProtoBuf = require("protobufjs");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var builder = ProtoBuf.loadProtoFile("tixs.proto");
var tixsMessages = builder.build();

mongoose.connect('mongodb://localhost/tixs', { config: { autoIndex: false } });

var deviceSchema = new Schema({
  imei: { type: String, index:{ unique: true}},
  longVersion: String,
  hwVersion: String,
  date: { type: Date, default: Date.now }
});


var Device = mongoose.model('Device', deviceSchema);


client.on('connect', function () {
    console.log("Connected to Broker");
    client.subscribe('t/start');
    client.publish('presence', 'Hello mqtt');
});

client.on('message', function (topic, message) {
    // message is Buffer
    msg = tixsMessages.telematik.Startup.decode(message);
    if( msg !== null )
    {
        Device.update(
            {imei: msg.getImei()},
            {
                $setOnInsert: {imei: msg.getImei()},
                $set: { date: Date.now(), longVersion: msg.getLongVersion(), hwVersion: msg.getHwVersion() }
            },
            {upsert: true},
            function(err,num){ console.log(num); }
        );
    }
  console.log(msg.getImei());

});