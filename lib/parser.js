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
	 * @throws  {lib/errors/base} parsing error
	 * @returns {lib/match}
	 */
	parse(text) {
		if (text === undefined) {
			throw new Error('Must specify a string argument to parser.parse()');
		}

		var raw_result = this.getRule().match(text);

		return Match.fromRawResult(raw_result);
	}

	/**
	 * The same as the above, except this method will swallow any errors that
	 * are thrown during parsing, as a convenience to consumers who don't
	 * want to bother with all that mess.
	 *
	 * @param   {string} text
	 * @returns {lib/match|null}
	 */
	parseSafe(text) {
		try {
			return this.parse(text);
		} catch (error) {
			return null;
		}
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

		return Unparser.fromRule(rule);
	}

	/**
	 * Returns an unparser for this parser's specified rule.
	 *
	 * @returns {lib/unparser}
	 */
	getUnparser() {
		return Unparser.fromRule(this.getRule());
	}

}


/**
 * Convenience method to generate a parser from a rule.
 *
 * @param   {lib/rule} rule
 * @returns {lib/parser}
 */
Parser.fromRule = function fromRule(rule) {
	return (new Parser())
		.setRule(rule);
};

/**
 * Convenience method to generate a parser from a string.
 *
 * @param   {string} string
 * @param   {lib/rule-list|void} rule_list
 * @returns {lib/parser}
 */
Parser.fromString = function fromString(string, rule_list) {
	if (!string || typeof string !== 'string') {
		throw new Error('Invalid value passed to Parser.fromString()');
	}

	var
		rule_list = RuleList.fromString(string, rule_list),
		rule      = rule_list.getFirstRule();

	return Parser.fromRule(rule);
};

extend(Parser.prototype, {
	rule_list: null,
	rule:      null
});

module.exports = Parser;
