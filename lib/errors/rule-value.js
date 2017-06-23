
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');

class RuleValueError extends BaseError {

	/**
	 * @returns {string}
	 */
	getRuleName() {
		return this.rule_name;
	}

	/**
	 * @returns {boolean}
	 */
	hasRuleName() {
		return this.getRuleName() !== null;
	}

	/**
	 * @param   {string} rule_name
	 * @returns {self}
	 */
	setRuleName(rule_name) {
		this.rule_name = rule_name;
		return this;
	}

}

extend(RuleValueError.prototype, {
	rule_name: null
});

module.exports = RuleValueError;
