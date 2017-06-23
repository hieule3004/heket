
var
	RuleValueError = require('./rule-value'),
	extend         = require('../utilities/extend');


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

	/**
	 * @param   {boolean} should_be_suppressed
	 * @returns {self}
	 */
	setShouldBeSuppressed(should_be_suppressed) {
		this.should_be_suppressed = should_be_suppressed;
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	shouldBeSuppressed() {
		return this.should_be_suppressed;
	}

}

extend(MissingRuleValueError.prototype, {
	should_be_suppressed: true
});

module.exports = MissingRuleValueError;
