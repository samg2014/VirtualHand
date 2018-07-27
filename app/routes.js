let pug = require('pug');
let path = require('path');
let fs = require('fs');
let Course = require('./models/course').model;
let Enrollment = require('./models/enrollment').model;
let HallPassRequest = require('./models/hallPassRequest').model;
let AssistanceRequest = require('./models/assistanceRequest').model;
let Token = require('./token_manager');

let templates = {
	student_home: './app/views/student/student_home.pug',
	teacher_home: './app/views/teacher/teacher_home.pug',
	teacher_hall_pass: './app/views/teacher/teacher_hall_pass.pug',
	landing: './app/views/landing.pug',
	login: './app/views/login.pug',
	signup: './app/views/signup.pug',
	password_recovery: './app/views/password_recovery.pug',
	teacher_hall_pass_history: './app/views/teacher/teacher_history_hall_pass.pug',
	teacher_assistance_request_history: './app/views/teacher/teacher_history_assistance_request.pug'
};

let compiledTemplates = {};
Object.keys(templates).map(k => templates[k]).map((val) => {compiledTemplates[val] = pug.compileFile(val, undefined)});

fs.writeFileSync('./app/views/teacher/modules/hall_pass_list_item_template_compiled.js', pug.compileFileClient('./app/views/teacher/modules/hall_pass_list_item_template.pug', {name: "listItemTemplate"}));

function renderFile(filename, data) {
	if (process.env.VH_ENV === 'DEVELOPMENT') {
		return pug.renderFile(filename, data, undefined);
	} else {
		return compiledTemplates[filename](data);
	}
}

module.exports = function (app, passport) {


	let dingFilepath = path.join(__dirname + '/../client/static/ding.wav');
	let stlLogoFilepath = path.join(__dirname + '/../client/static/stl_logo.png');
	let vhLogoFilepath = path.join(__dirname + '/../client/static/vh_logo.png');

	app.get('/home', isLoggedIn, function (req, res) {
		if (req.user.role === 'teacher') {
			res.redirect('/teacher/home');
		} else if (req.user.role === 'student') {
			res.redirect('/student/home');
		}
	});

	app.get('/teacher/home', isLoggedIn, isTeacher, function(req, res) {
		Course.taughtBy(req.user._id)
			.then(function (courses) {
				let renderData = {
					user: req.user,
					courses: courses,
					token: Token.getSocketToken(req.user)
				};

				res.send(renderFile(templates.teacher_home, renderData));
			});
	});

	app.get('/teacher/hallpass', isLoggedIn, isTeacher, function(req, res) {
		Course.taughtBy(req.user._id)
			.then(function (courses) {
				let renderData = {
					user: req.user,
					courses: courses,
					token: Token.getSocketToken(req.user)
				};

				res.send(renderFile(templates.teacher_hall_pass, renderData));
			});
	});

	app.get('/teacher/history/hallpass/:cid', isLoggedIn, isTeacher, function(req, res) {
		Course.verifyCourseTaughtBy(req.params.cid, req.user._id)
			.then(() => {return HallPassRequest.find({course: req.params.cid}).populate('student')})
			.then(function(requests) {
				let renderData = {
					user: req.user,
					requests: requests,
					token: Token.getSocketToken(req.user)
				};

				res.send(renderFile(templates.teacher_hall_pass_history, renderData));
			});
	});

	app.get('/teacher/history/assistancerequest/:cid', isLoggedIn, isTeacher, function(req, res) {
		Course.verifyCourseTaughtBy(req.params.cid, req.user._id)
			.then(() => {return AssistanceRequest.find({course: req.params.cid}).populate('student')})
			.then(function(requests) {
				let renderData = {
					user: req.user,
					requests: requests,
					token: Token.getSocketToken(req.user)
				};

				res.send(renderFile(templates.teacher_assistance_request_history, renderData));
			});
	});

	app.get('/student/home', isLoggedIn, isStudent, function(req, res) {
		Enrollment.find({student: req.user._id, valid: true, admitted: true}).populate('course')
			.then(function (enrollments) {
				let renderData = {
					user: req.user,
					enrollments: enrollments,
					token: Token.getSocketToken(req.user)
				};

				res.send(renderFile(templates.student_home, renderData));
			});
	});

	app.get('/logout', isLoggedIn, function (req, res) {
		req.logout();
		res.redirect('/');
	});

	app.get('/', function (req, res) {
		//res.redirect('/login');
		res.send(renderFile(templates.landing, {}));
	});

	app.get('/login', isNotLoggedIn, function (req, res) {
		res.send(renderFile(templates.login, {
			message: req.flash('loginMessage')
		}));
	});

	app.post('/login', isNotLoggedIn, passport.authenticate('local-login', {
		successRedirect: '/home', // redirect to the secure home section
		failureRedirect: '/login', // redirect back to the login page if there is an error
		failureFlash: true
	}));

	app.get('/signup', isNotLoggedIn, function (req, res) {
		// render the page and pass in any flash data if it exists
		res.send(renderFile(templates.signup, {
			message: req.flash('signupMessage')
		}));
	});

	app.post('/signup', isNotLoggedIn, passport.authenticate('local-signup', {
		successRedirect: '/home', // redirect to the secure home section
		failureRedirect: '/signup', // redirect back to the signup page if there is an error
		failureFlash: true
	}));

	app.get('/recoverpassword', isNotLoggedIn, function (req, res) {
		res.send(renderFile(templates.password_recovery, {
			token: Token.getSocketToken(null)
		}));
	});

	app.get('/stl_logo', function (req, res) {
		res.set({'Content-Type': 'image/png'});
		let readStream = fs.createReadStream(stlLogoFilepath);
		readStream.pipe(res);
	});

	app.get('/vh_logo', function (req, res) {
		res.set({'Content-Type': 'image/png'});
		let readStream = fs.createReadStream(vhLogoFilepath);
		readStream.pipe(res);
	});

	app.get('/notification_audio', function (req, res) {
		res.set({'Content-Type': 'audio/mpeg'});
		let readStream = fs.createReadStream(dingFilepath);
		readStream.pipe(res);
	});
};

function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the login page
	res.redirect('/login');
}

function isNotLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()) {
		res.redirect('/home');
	} else {
		return next();
	}
}

// If the user is a teacher, continue,
// Otherwise, redirect them home
function isTeacher(req, res, next) {
	if(req.user.role === 'teacher')
		return next();
	res.redirect('/home');
}

// If the user is a student, continue,
// Otherwise, redirect them home
function isStudent(req, res, next) {
	if(req.user.role === 'student')
		return next();
	res.redirect('/home');
}
