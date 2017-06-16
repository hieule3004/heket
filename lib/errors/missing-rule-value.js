
var
	BaseError = require('./base');

class MissingRuleValueError extends BaseError {
}

module.exports = MissingRuleValueError;
