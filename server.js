var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://teletubbie.test.b2b.pixida.com');
var ProtoBuf = require("protobufjs");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var express    = require('express');        // call express
var app        = express();  
var bodyParser = require('body-parser');

var builder = ProtoBuf.loadProtoFile("tixs.proto");
var tixsMessages = builder.build();


var port = process.env.PORT || 8080;        // set our port

mongoose.connect('mongodb://localhost/tixs', { config: { autoIndex: false } });
mongoose.Promise = require('bluebird');
//assert.equal(query.exec().constructor, require('bluebird'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var Device = require('./app/models/device');
var Group = require('./app/models/group');

// SETUP DB
Group.findOne({'name': 'Default'}, function( err, group )
{
  if( group === null )
  {
    console.log("Creating default Groups");
    new Group({name: 'Default'}).save();
    new Group({name: 'Development'}).save();
  }
});



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

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.route('/devices')
  .get(function(req, res) {
        Device.find(function(err, devices) {
            if (err)
                res.send(err);
            res.json(devices);
    });
  });
router.route('/groups')
  .get(function(req, res) {
        Group.find(function(err, groups) {
            if (err)
                res.send(err);
            res.json(groups);
    });
  });

  router.route('/groups/:group_id')
    .put(function(req, res) {
        Group.findById(req.params.group_id, function(err, group) {
            if (err)
                res.send(err);
            
            group.config = req.body;  // update the groups info
            console.log(group);
            // save the group
            group.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'group updated!' });
            });

        });
    });

  router.route('/group/software/:group_id')
    .put(function(req, res) {
        Group.findById(req.params.group_id, function(err, group) {
            if (err)
                res.send(err);
            
            group.software = req.body;  // update the groups info
            console.log(group);
            // save the group
            group.save(function(err) {
                if (err)
                    res.send(err);
                res.json({ message: 'group updated!' });
            });

        });
    });


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use(express.static('public'));
app.use('/config', express.static('public/index.html') );
app.use('/software', express.static('public/index.html') );
app.use('/css', express.static('node_modules/bootstrap/dist/css'));
app.use('/js', express.static('node_modules/jquery/dist'));
app.use('/js', express.static('node_modules/bootstrap/dist/js'));
app.use('/js', express.static('node_modules/tether/dist/js'));
app.use('/js', express.static('node_modules/angular'));
app.use('/js', express.static('node_modules/angular-route'));



// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);