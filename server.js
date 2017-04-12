var mqtt = require('mqtt');
var async = require("async");
var ProtoBuf = require("protobufjs");
var mongoose = require('mongoose');
var fs = require('fs');

var Schema = mongoose.Schema;
var express = require('express');        // call express
var app = express();
var bodyParser = require('body-parser');

var configMessage = null;
var startupMessage = null;
var softwareUpdate = null;


ProtoBuf.load("tixs.proto", function(err, root) {
    if(err) {
        console.log(err);
    }
    configMessage = root.lookupType("telematik.Config");
    startupMessage = root.lookupType("telematik.Startup");
    softwareUpdate = root.lookupType("telematik.SoftwareUpdate");

});


var excel = require('./app/excel.js');
var config = require('./config.js');

var port = process.env.PORT || 8080;        // set our port


var client = mqtt.connect(config.mqttHost, config.mqttOptions);

mongoose.connect(config.mongoURL, config.mongoOptions);
mongoose.Promise = require('bluebird');
//assert.equal(query.exec().constructor, require('bluebird'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


var Device = require('./app/models/device');
var Group = require('./app/models/group');


// SETUP DB
Group.findOne({'name': 'Default'}, function (err, group)
{
    if (group === null)
    {
        console.log("Creating default Groups");
        new Group({name: 'Default'}).save();
        new Group({name: 'Development'}).save();
    }
});

client.on('error', function (e) {
    console.log("Failure", e);
});



client.on('connect', function () {
    console.log("Connected to Broker");
    client.subscribe(config.mqttStartupFilter);
    //client.publish('presence', 'Hello mqtt');
});


function pushSWUpdateNotification(updateURL) {
    return softwareUpdate.encode({"url": updateURL}).finish();
}


function pushConfigUpdateNotification(config) {
    console.log(config);
    return configMessage.encode(config).finish();
}




function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

client.on('message', function (topic, message) {
    // message is Buffer
    // Subscribed only to "t/start" now
    msg = startupMessage.decode(message);

    if (msg !== null)
    {

        var deviceInDB = null;
        var group = null;

        async.waterfall([
            function (callback) {

                // Update device status in local DB first
                Device.update(
                        {imei: msg.imei},
                        {
                            $setOnInsert: {imei: msg.imei},
                            $set: {date: Date.now(), longVersion: msg.longVersion, hwVersion: msg.HwVersion, reportedConfiguration: msg.version}
                        },
                        {upsert: true},
                        function (err, num) {
                            console.log("Device updated", num);
                            callback(null);
                        }
                )
            },
            function (callback) {
                // Find device
                Device.findOne({imei: msg.imei}, function (err, dev) {
                    if (err) {
                        console.log("err", err);
                        callback(err);
                    }
                    deviceInDB = dev;
                    callback(null);

                });
            },
            function (callback) {
                // Find group
                Group.findOne({name: deviceInDB.group}, function (err, grp) {
                    if (err) {
                        console.log("err", err);
                        callback(err);
                    }
                    console.log("grp", grp);
                    group = grp;

                    callback(null);

                });

            },
            function (callback) {
                // Decide what to push to device and push

                // Get group object from mongoose schema object
                var groupObject = group.toObject({getters:false});
                var configUpdate = groupObject.config;

                // Compare software version number
                var swVersionInstalled = deviceInDB.longVersion.substr(deviceInDB.longVersion.length - 7);
                var swVersionRequired = group.software.expected_version;

                var swConfigInstalled = deviceInDB.reportedConfiguration;
                var swConfigRequired = groupObject.version;

                console.log(msg.imei, "SW Installed", swVersionInstalled, "SW Required", swVersionRequired);
                console.log(msg.imei, "Config installed", swConfigInstalled, "Config required", swConfigRequired);

                if (swVersionRequired !== null && swVersionRequired.length > 0 && swVersionInstalled !== swVersionRequired) {
                    console.log(msg.imei, "SW Installed:", swVersionInstalled, "SW Required:", swVersionRequired);

                    // Push software update request
                    console.log("Push download URL", group.software.url)

                    var swUpdateMessage = pushSWUpdateNotification(msg.imei, group.software.url);

                    client.publish('mqtt/test', swUpdateMessage.buffer, function () {
                        console.log('Software update request sent');
                    });
                } else if (swConfigRequired === null) {
                    console.log(msg.imei, "Device needs software update, remote update not enabled for this application.");
                } else if (isNumeric(swConfigInstalled)) {
                    // Does require config?
                    if (swConfigInstalled !== swConfigRequired) {
                        console.log("swConfigInstalled", swConfigInstalled, "swConfigRequired", swConfigRequired);

                        // Update configuration
                        //group.config['configVersion'] = swConfigRequired;
                        var groupObject = group.toObject({getters:false});
                       
                        var imei = msg.imei;
                        configUpdate.configVersion = swConfigRequired;
                        console.log(configUpdate);
                        console.log("configVersion in JSON", configUpdate.configVersion);

                        
                        var configUpdateMsg = pushConfigUpdateNotification(configUpdate);
                        if(imei==="861359030249799") {
                            console.log("Hex", configUpdateMsg.toString('hex'));

                           client.publish('c/'+imei+'/config', configUpdateMsg, function () {
                                console.log('Config update request sent');
                            });
                        }


                    }
                }
                callback(null);

            }
        ], function (err, result) {
            if (err) {
                console.log("err", err);

            }

        });

    }
});

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

router.route('/devices')
        .get(function (req, res) {
            Device.find(function (err, devices) {
                if (err)
                    res.status(400).send(err);
                res.json(devices);
            });
        });

router.route('/device/:device_id')
        .put(function (req, res) {
            Device.findById(req.params.device_id, function (err, device) {
                if (err)
                    res.send(err);

                console.log("Request Body", req.body);
                device.group = req.body.group;  // update the groups info
                console.log(device);
                // save the group
                device.save(function (err) {
                    if (err)
                        res.status(400).send(err);

                    res.json({message: 'device updated!'});
                });

            });
        });

router.route('/groups')
        .get(function (req, res) {
            Group.find(function (err, groups) {
                if (err)
                    res.status(400).send(err);
                res.json(groups);
            });
        });

router.route('/groups/:group_id')
        .put(function (req, res) {
            Group.findById(req.params.group_id, function (err, group) {
                if (err)
                    res.send(err);

                group.config = req.body;  // update the groups info
                group.version = group.version + 1;
                // save the group
                
           
                
                group.save(function (err) {
                    if (err)
                        res.status(400).send(err);

                    res.json({message: 'group updated!'});
                });

            });
        });

router.route('/group')
        .put(function (req, res) {
            // Create new group

            var groupName = (req.body).groupName;
            new Group({name: groupName}).save(function (err) {
                if (err) {
                    res.status(400).send(err);
                    return;
                }

                res.json({message: 'Group Created!'});
            });

        });

router.route('/group/software/:group_id')
        .put(function (req, res) {
            console.log("Group ID", req.params.group_id);
            Group.findById(req.params.group_id, function (err, group) {
                if (err) {
                    res.send(err);
                    return;
                }


                group.software = req.body;  // update the groups info
                // save the group
                group.save(function (err) {
                    if (err) {
                        res.status(400).send(err);
                        return;
                    }
                    res.json({message: 'group updated!'});

                });

            });
        });
router.route('/excel')
        .get(function (req, res) {
            Device.find(function (err, devices) {
                if (err)
                    res.status(400).send(err);
                res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                res.setHeader("Content-Disposition", "attachment; filename=" + "Report.xlsx");
                res.send(excel(devices));

            });
        });


// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);
app.use(express.static('public'));
app.use('/config', express.static('public/index.html'));
app.use('/software', express.static('public/index.html'));
app.use('/css', express.static('node_modules/bootstrap/dist/css'));
app.use('/css', express.static('node_modules/toastr/build'));
app.use('/js', express.static('node_modules/jquery/dist'));
app.use('/js', express.static('node_modules/bootstrap/dist/js'));
app.use('/js', express.static('node_modules/tether/dist/js'));
app.use('/js', express.static('node_modules/angular'));
app.use('/js', express.static('node_modules/angular-route'));
app.use('/js', express.static('node_modules/toastr/build'));
app.use('/fonts', express.static('node_modules/bootstrap/fonts'));



// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);