const nodemailer = require('nodemailer');

/**
 * Email message
 * @param {array} mailOptions The Mail Options
 * @param {boolean} log true=log email, else don't
 */
module.exports = function (mailOptions, log) {
	let transporter = nodemailer.createTransport({
		service: process.env.EMAIL_SERVICE,
		port: process.env.EMAIL_PORT,
		secure: true,
		auth: {
			user: process.env.EMAIL_ADDRESS,
			pass: process.env.EMAIL_PASSWORD
		}
	});

	transporter.sendMail(mailOptions, function (error, info) {
		if (error) {
			console.error(error);
		} else {
			if (log == true)
				console.log(`Email sent: ${ info.response }\nFrom: ${ mailOptions.from }\nTo: ${ mailOptions.to }\nSubject: ${ mailOptions.subject }\nText: ${ mailOptions.text }`);
		}
	});
};