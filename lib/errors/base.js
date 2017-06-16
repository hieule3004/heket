
var
	extend = require('../utilities/extend');


class BaseError extends Error {

	constructor(rule_name, rule_value) {
		super();

		this.setRuleName(rule_name);
		this.setRuleValue(rule_value);
		this.assignMessage();
	}

	getRuleName() {
		return this.rule_name;
	}

	setRuleName(rule_name) {
		this.rule_name = rule_name;
		return this;
	}

	getRuleValue() {
		return this.rule_value;
	}

	setRuleValue(rule_value) {
		this.rule_value = rule_value;
		return this;
	}

	assignMessage() {
		throw new Error('Must override assignMessage() in BaseError subclass');
	}

}

extend(BaseError.prototype, {
	rule_name:  null,
	rule_value: null
});

module.exports = BaseError;
