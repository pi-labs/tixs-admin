var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;


var DeviceSchema = new Schema({
  imei: { type: String, index:{ unique: true}},
  longVersion: String,
  hwVersion: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Device', DeviceSchema);