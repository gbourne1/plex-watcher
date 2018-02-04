const winston = require('winston'),
	util = require('util');

module.exports.winston = (env, pretty = false, type = 'all') => {
	let consoleLog = new winston.transports.Console({
		colorize: true,
		prettyPrint: pretty,
		label: env,
		humanReadableUnhandledException: true,
		timestamp: true
	});

	let fileLog = new winston.transports.File({
		filename: 'plex-watcher.log'
	});

	let params = [];
	if(type === 'all') {
		params.push(consoleLog);
		params.push(fileLog);
	}
	else if(type === 'console')
		params.push(consoleLog);
	else if (type === 'file')
		params.push(fileLog);
	else
		console.error('Logger Output param not found.');

	const logger = new(winston.Logger)({
		transports: params
	});

	logger.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

	return logger;
};

module.exports.pretty =  (obj) => {
	return util.inspect(obj, false, null);
};