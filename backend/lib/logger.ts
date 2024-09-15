import winston = require("winston");

export const logger = winston.createLogger({
	level: "info",
	format: winston.format.simple(),
	defaultMeta: { service: "crypto-demo-backend" },

	transports: [new winston.transports.Console({ forceConsole: true })],
});
