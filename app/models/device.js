var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var DeviceSchema = new Schema({
  imei: { type: String, index:{ unique: true}},
  longVersion: String,
  hwVersion: String,
  reportedConfiguration: Number,
  date: { type: Date, default: Date.now },
  group: { type: String, default: 'Default', ref : 'Group' }
});

module.exports = mongoose.model('Device', DeviceSchema);