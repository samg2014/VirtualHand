// app/models/user.js
// load the things we need
let mongoose = require('mongoose');
let bcrypt = require('bcrypt');

// define the schema for our user model
let userSchema = mongoose.Schema({
	username: String,
	password: String,
	email: String,
	email_verified: {type: Boolean, default: false},
	role: {type: String, enum: ['admin', 'teacher', 'student']},
	timestamp: {type: Date, default: Date.now}
});

userSchema.pre('validate', function (next) {
	this.timestamp = new Date();
	next();
});

function generateHash(password) {
	return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
}

userSchema.statics.generateHash = generateHash;

// checking if password is valid
userSchema.methods.validPassword = function (password) {
	return bcrypt.compareSync(password, this.password);
};

userSchema.statics.findOrCreate = function (username, password) {
	username = (username !== undefined && username !== " " && username !== "") ? username : undefined;
	let User = this;
	return User.findOne({username: username})
		.then(user => user || User.create({username: username, password: generateHash(password)}));
};

// create the model for users and expose it to our app
module.exports = {model: mongoose.model('User', userSchema)};