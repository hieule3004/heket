
var
	BaseError = require('./base');


/**
 * This error class is thrown when unparsing a grammar into a string,
 * and a rule value doesn't exist for a required rule.
 */
class MissingRuleValueError extends BaseError {

	/**
	 * @returns {void}
	 */
	assignMessage() {
		var rule_name = this.getRuleName();

		this.message = `Must supply a value for rule <${rule_name}>`;
	}

}

module.exports = MissingRuleValueError;
