// app/models/hallPassRequest.js
// load the things we need
let mongoose = require('mongoose');
let User = require('./user');
let Course = require('./course');

// define the schema for our user model
let hallPassRequestSchema = mongoose.Schema({
	requestTime: {type: Date, default: Date.now},
	student: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
	granted: Boolean,
	grantedTime: {type: Date, default: null},
	resolved: Boolean,
	resolvedTime: {type: Date, default: null},
	resolved_type: String,
	timestamp: {type: Date, default: Date.now}
});

hallPassRequestSchema.pre('validate', function (next) {
	this.timestamp = new Date();
	next();
});

// create the model for users and expose it to our app
module.exports = {
	model: mongoose.model('HallPassRequest', hallPassRequestSchema),
};