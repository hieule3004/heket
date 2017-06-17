var
	RuleList = require('./rule-list'),
	Match    = require('./match'),
	Unparser = require('./unparser'),
	extend   = require('./utilities/extend');


/**
 * This class is pretty simplistic. It's just an orchestrator that kicks off
 * the matching logic on the underlying rule.
 */
class Parser {

	/**
	 * Return the ABNF rule associated with this parser.
	 *
	 * @returns {lib/rule}
	 */
	getRule() {
		return this.rule;
	}

	/**
	 * Sets the ABNF rule associated with this parser.
	 *
	 * @param   {lib/rule} rule
	 * @returns {self}
	 */
	setRule(rule) {
		this.rule = rule;
		return this;
	}

	/**
	 * Returns the rule list associated with this parser's node.
	 *
	 * @returns {lib/rule-list}
	 */
	getRuleList() {
		return this.getRule().getRuleList();
	}

	/**
	 * Parse the given text using the ABNF grammar for the rule associated
	 * with this parser instance.
	 *
	 * @param   {string} text
	 * @returns {lib/match|null}
	 */
	parse(text) {
		var raw_result = this.getRule().match(text);

		if (!raw_result) {
			return null;
		}

		return Match.fromRawResult(raw_result);
	}

	/**
	 * Returns a child parser for the specified rule name. This is done
	 * via a lookup against the rule list of our current rule.
	 *
	 * @param   {string} rule_name
	 * @returns {lib/parser}
	 */
	getParserForRule(rule_name) {
		var rule = this.getRuleList().getRuleByName(rule_name);

		return (new Parser())
			.setRule(rule);
	}

	/**
	 * Returns an unparser instance for the specified rule name. This is done
	 * via a lookup against the rule list of our current rule.
	 *
	 * @param   {string} rule_name
	 * @returns {lib/unparser}
	 */
	getUnparserForRule(rule_name) {
		var rule = this.getRuleList().getRuleByName(rule_name);

		return (new Unparser())
			.setRule(rule);
	}

	/**
	 * Returns an unparser for this parser's specified rule.
	 *
	 * @returns {lib/unparser}
	 */
	getUnparser() {
		return (new Unparser())
			.setRule(this.getRule());
	}

}


/**
 * Convenience method to generate a parser from a string.
 *
 * @param   {string} string
 * @param   {lib/rule-list|void} rule_list
 * @returns {lib/parser}
 */
Parser.fromString = function fromString(string, rule_list) {
	var
		rule_list = RuleList.fromString(string, rule_list),
		rule      = rule_list.getFirstRule();

	return (new Parser())
		.setRule(rule);

};

extend(Parser.prototype, {
	rule_list: null,
	rule:      null
});

module.exports = Parser;
