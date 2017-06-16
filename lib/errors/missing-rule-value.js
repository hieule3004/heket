
var
	BaseError = require('./base');

class MissingRuleValueError extends BaseError {

	assignMessage() {
		var rule_name = this.getRuleName();

		this.message = `Must supply a value for rule <${rule_name}>`;
	}

}

module.exports = MissingRuleValueError;
