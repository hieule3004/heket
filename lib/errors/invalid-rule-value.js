
var
	BaseError = require('./base');

class InvalidRuleValueError extends BaseError {

	/**
	 * @returns {void}
	 */
	assignMessage() {
		var
			rule_name  = this.getRuleName(),
			rule_value = this.getRuleValue();

		this.message = `Invalid value for rule <${rule_name}>: ${rule_value}`;
	}

}

module.exports = InvalidRuleValueError;
