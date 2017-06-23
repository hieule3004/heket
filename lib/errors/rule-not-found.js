
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');


/**
 * This error class is thrown when trying to parse / unparse via an ABNF rule
 * list, and Heket can't find a rule for a referenced rule name.
 */
class RuleNotFoundError extends BaseError {

	constructor(rule_name, value, node) {
		super(value, node);

		this.setRuleName(rule_name);
	}

	setRuleName(rule_name) {
		this.rule_name = rule_name;
		return this;
	}

	getRuleName() {
		return this.rule_name;
	}

	/**
	 * @returns {void}
	 */
	getMessage() {
		var rule_name = this.getRuleName();

		return `Rule not found: <${rule_name}>`;
	}

}

extend(RuleNotFoundError.prototype, {
	rule_name: null
});

module.exports = RuleNotFoundError;
