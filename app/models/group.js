var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var GroupSchema = new Schema({
    name: { type: String, unique : true, required : true },
    version: {type: Number, default: 0},
    config: {
        enableTransmitAcceleration: {type: Boolean, default: true},
        gpsFilterMinAccuracyM: {type: Number, default: 3 },
        enableTransmitUpdatePosition: {type: Boolean, default: true},
        enableTransmitGPS: {type: Boolean, default: true},
        enableInactivityDetection: {type: Boolean, default: true},
        ecallBcallSmsNumber: String,
        secondaryEcallBcallSmsNumber: String,
        accSendThresholdPercent: Number,
        enableBCall: {type: Boolean, default: true},
        enableECall: {type: Boolean, default: true},
        inactivitySleepTimeoutSec: Number,
        inactivityDetectionThreshold: Number,
        agpsConfig: Number,
        stateUpdatePeriod: Number
    },
    software: {
        expected_version: {type: 'String', default: ''},
        url: {type: 'String', default: ''}
    },

});

module.exports = mongoose.model('Group', GroupSchema);