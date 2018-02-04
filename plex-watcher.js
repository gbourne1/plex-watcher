#! /usr/bin/env node

'use strict';

require('app-module-path').addPath(__dirname);
require('dotenv').config();
const express = require('express'),
	path = require('path'),
	notifier = require('node-notifier'),
	emailer = require('utils/emailer'),
	favicon = require('serve-favicon'),
	logger = require('morgan'),
	bodyParser = require('body-parser'),
	pretty = require('utils/logger').pretty,
	PlexAPI = require('plex-api'),
	spawn = require('child_process').spawn,
	argv = require('yargs').argv;

// Get arguments
let logType = 'file';
if (argv.v)
	logType = 'all';
else
	console.log('not found: ' + argv.v);

const log = require('utils/logger').winston('plex-watcher.js', true, logType),
	logConsole = require('utils/logger').winston('', true);

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(favicon(path.join(__dirname, 'public/images', 'plex.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static(path.join(__dirname, 'public')));

// Tail the logs to the browser
app.get('/tail', (req, res) => {
	let tail = spawn('tail', ['-f', '-n', '+1', path.join(__dirname, 'plex-watcher.log')]);
	tail.stdout.pipe(res);
});

/** Get the command line arguments ----- */
// notify an email
const notify = argv.notify ? argv.notify : process.env.SEND_NOTIFY,
	emailSend = argv.emailSend ? argv.emailSend : process.env.SEND_EMAIL;

// Email command line args
process.env.EMAIL_SERVICE = argv.email ? argv.email : process.env.EMAIL_SERVICE,
process.env.EMAIL_PORT = argv.emailPort ? argv.emailPort : process.env.EMAIL_PORT,
process.env.EMAIL_ADDRESS = argv.emailAddress ? argv.emailAddress : process.env.EMAIL_ADDRESS,
process.env.EMAIL_PASSWORD = argv.emailPassword ? argv.emailPassword : process.env.EMAIL_PASSWORD;

// see if command line arguments
const hostname = argv.hostname ? argv.hostname : process.env.PLEX_HOSTNAME,
	port = argv.port ? argv.port : process.env.PLEX_PORT,
	username = argv.username ? argv.username : process.env.PLEX_USERNAME,
	password = argv.password ? argv.password : process.env.PLEX_PASSWORD,
	timer = argv.timer ? argv.timer : process.env.TIMER_MILLISECONDS;
// ---------------------------------------

// Plex
const plexClient = new PlexAPI({
	hostname,
	port,
	username,
	password
});

// Welcome Message
logConsole.info('Welcome to plex-watcher');
logConsole.info(`Starting watcher on: ${hostname}`);
logConsole.info('Use flag "--v" for verbose to the console');
logConsole.info('See the logs live at: http://localhost:5000');

var watcherPrevious = new Map();
(function plexLoop() {
	plexClient.query('/status/sessions').then(result => {
		//log.info(pretty(result));

		let watcherCurrent = new Map();
		let watcherStarted = new Map();
		let watcherStopped = new Map();

		let size = parseInt(result.MediaContainer.size);
		log.info(`Videos being watched: ${size}`);

		// Discover if started watching
		for (let i = 0; i < size; i++) {
			let video = result.MediaContainer.Video[i],
				title = video.title,
				user = video.User.title + '|' + title, // Compensate if same user watching multiple
				state = video.Player.state;

			let data = watcherPrevious.get(user);
			if (data && data.title === title && (data.state === state || (data.state !== 'paused' && state !== 'playing'))) {
				if (state !== 'paused')
					log.info(`${user} is still watching ${title}`);
				else
					log.info(`${user} is paused ${title}`);

				watcherCurrent.set(user, {
					title,
					state
				});
			} else {
				watcherCurrent.set(user, {
					title,
					state
				});
				watcherStarted.set(user, {
					title,
					state
				});
			}
		}

		// Discover if stopped watching or paused
		watcherPrevious.forEach((show, user) => {
			let data = watcherCurrent.get(user);
			if ((data && data.title !== show.title) || (data.title === show.title && show.state === 'playing' && data.state === 'paused'))
				watcherStopped.set(user, {
					title: data.title,
					state: data.state
				});
		});

		// Send Messages
		if (watcherStarted.size > 0 || watcherStopped.size > 0) {
			log.info(`Started or Stopped/Paused Watcher. Stopped/Pause: ${pretty(watcherStopped)} Started: ${ pretty(watcherStarted)}`);

			if (notify === 'true')
				doNotify(watcherStarted, watcherStopped);
			if (emailSend === 'true')
				doEmail(watcherStarted, watcherStopped);
		} else
			log.info('No started or stopped watchers');

		// Assign current map to the previous map
		watcherPrevious = new Map(watcherCurrent);

	}, function (err) {
		log.error('Could not connect to server', err);
	});

	setTimeout(() => {
		plexLoop();
	}, timer);
})();

function doNotify(watcherStarted, watcherStopped) {
	// Notify all started - using default 5 second notification timeout
	let count = 0;
	watcherStarted.forEach((show, user) => {
		setTimeout(() => {
			sendNotification(show.title, user.slice(0, user.indexOf('|')), 'started');
		}, 6000 * count++);
	});

	// Notify all stopped - using default 5 second notification timeout
	count = 0;
	watcherStopped.forEach((show, user) => {
		setTimeout(() => {
			sendNotification(show.title, user.slice(0, user.indexOf('|')), getState(show.state));
		}, 6000 * count++);
	});
}

function sendNotification(title, user, action) {
	let options = {
		title: 'Plex Watcher',
		message: `${user} ${action} watching "${title}"`,
		icon: path.join(__dirname, '/public/images/plex.png'),
		sound: true,
		wait: true,
		actions: 'Close'
	};

	log.info(`${user} ${action} watching "${title}"`);

	notifier.notify(options);
}

function doEmail(watcherStarted, watcherStopped) {
	let started = '';
	watcherStarted.forEach((show, user) => {
		user = user.slice(0, user.indexOf('|'));
		started += `User: ${user} started watching ${show.title}\n`;
	});

	let stopped = '';
	watcherStopped.forEach((show, user) => {
		user = user.slice(0, user.indexOf('|'));
		stopped += `User: ${user} ${getState(show.state)} watching ${show.title}\n`;
	});

	let text = (started === '' && stopped === '') ? 'No One, No One At All' : started + stopped;

	let mailOptions = {
		from: 'PLEX <geoff@retirety.com>',
		to: 'geoff@retirety.com',
		subject: 'Plex: Guess Who is Watching',
		text: text
	};

	emailer(mailOptions, true);
}

const getState = (state) => {
	return state === 'paused' ? state : 'stopped';
};

// catch 404 and forward to error handler
app.use((req, res, next) => {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res, next) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;