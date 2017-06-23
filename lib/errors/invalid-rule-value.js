
var
	RuleValueError = require('./rule-value');

/**
 * This error class is thrown when unparsing a grammar into a string,
 * and a supplied rule value doesn't match the rule it was returned for.
 */
class InvalidRuleValueError extends RuleValueError {

	constructor(rule_name, value, node) {
		super(value, node);

		this.setRuleName(rule_name);
	}

	/**
	 * @returns {string}
	 */
	getMessage() {
		var
			rule_name  = this.getRuleName(),
			rule_value = this.getValue();

		// This *should* always be the case, but just in case we get a number
		// or some other non-falsy type in here:
		if (typeof rule_value === 'string') {
			rule_value = `"${rule_value}"`;
		}

		return `Invalid value for rule <${rule_name}>: ${rule_value}`;
	}

}

module.exports = InvalidRuleValueError;
