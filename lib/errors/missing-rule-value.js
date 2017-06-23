
var
	RuleValueError = require('./rule-value');


/**
 * This error class is thrown when unparsing a grammar into a string,
 * and a rule value doesn't exist for a required rule.
 */
class MissingRuleValueError extends RuleValueError {

	constructor(rule_name, node) {
		super(null, node);

		this.setRuleName(rule_name);
	}

	/**
	 * @returns {string}
	 */
	getMessage() {
		var rule_name = this.getRuleName();

		return `Must supply a value for rule <${rule_name}>`;
	}

}

module.exports = MissingRuleValueError;
