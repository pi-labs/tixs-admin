var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var GroupSchema = new Schema({
    name: String,
    config: {
        enableTransmitAcceleration: {type: Boolean, default: true},
        gpsFilterMinAccuracyM: {type: Number, default: 3 },
        enableTransmitUpdatePosition: {type: Boolean, default: true},
        enableTransmitGPS: {type: Boolean, default: true},
        enableInactivityDetection: {type: Boolean, default: true}
    },
    software: {
        expected_version: {type: 'String', default: ''},
        url: {type: 'String', default: ''}
    },

});

module.exports = mongoose.model('Group', GroupSchema);