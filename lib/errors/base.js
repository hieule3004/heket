
var
	extend = require('../utilities/extend');


class BaseError extends Error {

	/**
	 * @param   {string} rule_name
	 * @param   {string|null} rule_value
	 * @returns {void}
	 */
	constructor(rule_name, rule_value) {
		super();

		this.setRuleName(rule_name);
		this.setRuleValue(rule_value);
		this.assignMessage();
	}

	/**
	 * @returns {string}
	 */
	getRuleName() {
		return this.rule_name;
	}

	/**
	 * @param   {string} rule_name
	 * @returns {self}
	 */
	setRuleName(rule_name) {
		this.rule_name = rule_name;
		return this;
	}

	/**
	 * @returns {string|null}
	 */
	getRuleValue() {
		return this.rule_value;
	}

	/**
	 * @param   {string|null} rule_value
	 * @returns {self}
	 */
	setRuleValue(rule_value) {
		this.rule_value = rule_value;
		return this;
	}

	/**
	 * @throws {Error}
	 * @returns {void}
	 */
	assignMessage() {
		throw new Error('Must override assignMessage() in BaseError subclass');
	}

}

extend(BaseError.prototype, {
	rule_name:  null,
	rule_value: null
});

module.exports = BaseError;
