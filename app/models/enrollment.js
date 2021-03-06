// app/models/enrollment.js
// load the things we need
let mongoose = require('mongoose');
let User = require('./user');
let Course = require('./course');

// define the schema for our user model
let enrollmentSchema = mongoose.Schema({
	requestTime: {type: Date, default: Date.now},
	student: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	course: {type: mongoose.Schema.Types.ObjectId, ref: 'Course'},
	admitted: Boolean,
	valid: {type: Boolean, default: true},
	timestamp: {type: Date, default: Date.now}
});

enrollmentSchema.pre('validate', function (next) {
	this.timestamp = new Date();
	next();
});

enrollmentSchema.statics.getEnrolled = function getEnrolled(user) {
	return this.find({student: user._id, valid: true}).populate('course').sort('course.courseName');
};

enrollmentSchema.statics.findOrCreate = function (cid, uid, admitted) {
	return this.findOne({course: cid, student: uid, valid: true})
		.then(enrollment => enrollment || this.create({course: cid, student: uid, admitted: admitted}));
};

enrollmentSchema.statics.confirmStudentInClass = function(sid, cid) {
	return this.find({student: sid, course: cid, valid: true})
		.countDocuments()
		.then(function(count) {
			if (count <= 0) throw new Error('Student not in class!');
		});
};

// create the model for users and expose it to our app
module.exports = {
	model: mongoose.model('Enrollment', enrollmentSchema),
};