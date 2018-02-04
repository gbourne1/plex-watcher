const winston = require('winston'),
	util = require('util');

module.exports.winston = function(env, pretty) {
	if(!pretty)
		pretty = false;

	const logger = new (winston.Logger)({
		transports: [
			new winston.transports.Console({ 
				colorize: true,
				prettyPrint: pretty,
				label: env,
				humanReadableUnhandledException: true, 
				timestamp: true}),
			new winston.transports.File({ 
				filename: 'plex-watcher.log'})
		]
	});
	
	logger.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

	return logger;
};

module.exports.pretty = function(obj) {
	return util.inspect(obj, false, null);
};