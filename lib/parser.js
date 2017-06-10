var
	RulesList = require('./rules-list'),
	Match     = require('./match'),
	extend    = require('./utilities/extend');


class Parser {

	setRulesList(rules_list) {
		this.rules_list = rules_list;
		return this;
	}

	getRulesList() {
		return this.rules_list;
	}

	parse(text) {
		var raw_result = this.getRulesList().match(text);

		if (!raw_result) {
			return null;
		}

		return Match.fromRawResult(raw_result);
	}

}

Parser.fromString = function fromString(string, rules_list) {
	var rules_list = RulesList.fromString(string, rules_list);

	return (new Parser())
		.setRulesList(rules_list);
};

extend(Parser.prototype, {
	rules_list: null
});

module.exports = Parser;
