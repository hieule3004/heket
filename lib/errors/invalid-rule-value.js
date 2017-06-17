
var
	BaseError = require('./base');

/**
 * This error class is thrown when unparsing a grammar into a string,
 * and a supplied rule value doesn't match the rule it was returned for.
 */
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
