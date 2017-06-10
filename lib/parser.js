var
	RulesList = require('./rules-list'),
	Match     = require('./match'),
	extend    = require('./utilities/extend');


class Parser {

	getRule() {
		return this.rule;
	}

	setRule(rule) {
		this.rule = rule;
		return this;
	}

	getRulesList() {
		return this.getRule().getRulesList();
	}

	parse(text) {
		var raw_result = this.getRule().match(text);

		if (!raw_result) {
			return null;
		}

		return Match.fromRawResult(raw_result);
	}

	getParserForRule(rule_name) {
		var rule = this.getRulesList().getRuleByName(rule_name);

		return (new Parser())
			.setRule(rule);
	}

}

Parser.fromString = function fromString(string, rules_list) {
	var
		rules_list = RulesList.fromString(string, rules_list),
		rule       = rules_list.getFirstRule();

	return (new Parser())
		.setRule(rule);

};

extend(Parser.prototype, {
	rules_list: null,
	rule:       null
});

module.exports = Parser;
