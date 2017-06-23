/**
 * This module is comprised of the following components:
 *
 * 1. Rule (lib/rule)
 *
 * This is the top-level object used to represent an ABNF grammar declaration.
 * It's comprised of a top-level node representing the rule, which itself
 * has sub-nodes as children used to embody the grammar's AST.
 *
 *
 * 2. Node (lib/node)
 *
 * This represents one point in the hierarchy of the generated AST for a
 * particular ABNF grammar. The node parses its own ABNF string and recursively
 * creates any necessary child nodes.
 *
 *
 * 3. Parser (lib/parser)
 *
 * Parsers are pretty simplistic and basically coordinate between a top-level
 * ABNF rule and the Matcher instance responsible for checking whether a
 * specified string matches the rule.
 *
 *
 * 4. Matcher (lib/matcher)
 *
 * The Matcher class is used to check whether a particular string matches a
 * particular node in the hierarchy of a generated AST for an ABNF grammar.
 * Matchers are instantiated in a 1:1 relationship with nodes in the AST.
 *
 *
 * 5. Match (lib/match)
 *
 * A Match instance is returned when the Parser determines that a specific
 * string matches the generated AST for its associated ABNF grammar. The Match
 * class acts as a convenience wrapper around the parsed results, and grants
 * consumers an easy API for fetching values from the results list by rule name.
 *
 *
 * 6. RuleList (lib/rule-list)
 *
 * The RuleList class is a collection of related rules. By creating an external
 * linkage between all of the rules in a top-level ABNF specification, the
 * RuleList enables each rule to reference any other rule in the specification.
 * You can also append rules from other specifications, as well.
 *
 *
 * 7. Unparser (lib/unparser)
 *
 * Like the Parser, but in reverse. This class uses its corresponding ABNF AST
 * to produce an output string matching the grammar. It will prompt the consumer
 * for the value of any rule name that it encounters as it traverses the AST.
 */



var
	Parser   = require('./lib/parser'),
	Rule     = require('./lib/rule'),
	RuleList = require('./lib/rule-list'),
	Core     = require('./lib/core'),
	FS       = require('fs'),
	Path     = require('path');

var
	InputTooLongError           = require('./lib/errors/input-too-long'),
	InputTooShortError          = require('./lib/errors/input-too-short'),
	InvalidQuotedStringError    = require('./lib/errors/invalid-quoted-string'),
	InvalidRuleValueError       = require('./lib/errors/invalid-rule-value'),
	MissingRuleValueError       = require('./lib/errors/missing-rule-value'),
	NoMatchingAlternativeError  = require('./lib/errors/no-matching-alternative'),
	NotEnoughOccurrencesError   = require('./lib/errors/not-enough-occurrences'),
	NumericValueMismatchError   = require('./lib/errors/numeric-value-mismatch'),
	NumericValueOutOfRangeError = require('./lib/errors/numeric-value-out-of-range'),
	RuleNotFoundError           = require('./lib/errors/rule-not-found');



/**
 * Creates a parser for either:
 * - the specified ABNF string and (optional) rule list, or
 * - an existing rule
 *
 * @param   {string|lib/rule} string_or_rule
 * @param   {lib/rule-list|void} rule_list
 * @returns {lib/parser}
 */
function createParser(string_or_rule, rule_list) {
	if (string_or_rule instanceof Rule) {
		return Parser.fromRule(string_or_rule);
	} else if (typeof string_or_rule === 'string') {
		return Parser.fromString(string_or_rule, rule_list);
	} else {
		throw new Error('Invalid value passed to createParser()');
	}
}

/**
 * Creates an unparser for either:
 * - the specified ABNF string and (optional) rule list, or
 * - an existing rule
 *
 * @param   {string|lib/rule} string_or_rule
 * @param   {lib/rule-list|void} rule_list
 * @returns {lib/unparser}
 */
function createUnparser(string_or_rule, rule_list) {
	return createParser(string_or_rule, rule_list).getUnparser();
}

/**
 * Creates a rule list from the specified ABNF string and (optional) external
 * rule list.
 *
 * @param   {string} abnf_string
 * @param   {lib/rule-list|void} rule_list
 * @returns {lib/rule-list}
 */
function createRuleList(abnf_string, rule_list) {
	return RuleList.fromString(abnf_string, rule_list);
}

/**
 * Convenience function to read the contents of a file containing ABNF rule
 * declarations from disk.
 *
 * @param   {string} filename
 * @returns {string}
 */
function readABNFFile(filename) {
	var path = Path.resolve(__dirname, `./abnf/${filename}.abnf`);

	return FS.readFileSync(path, 'utf8');
}

/**
 * Convenience function to return the raw text corresponding to the ABNF
 * specification itself, embodied in ABNF.
 *
 * @returns {string}
 */
function getSpec() {
	return readABNFFile('abnf');
}

// Set up the core rules used in parsing ABNF grammars.
// These core rules are themselves embodied via ABNF, which requires that
// they live in a singleton and enumerated from outside the other classes
// in this module in order to avoid circular dependencies.
var core_rules = RuleList.fromString(readABNFFile('core-rules'));

Core.setRuleList(core_rules);


module.exports = {
	createParser,
	createUnparser,
	createRuleList,
	readABNFFile,
	getSpec,

	// Expose these error constructors on the module itself, so that consumers
	// are able to do `instanceof` checks on errors that they catch during
	// parsing / unparsing:
	InputTooLongError,
	InputTooShortError,
	InvalidQuotedStringError,
	InvalidRuleValueError,
	MissingRuleValueError,
	NoMatchingAlternativeError,
	NotEnoughOccurrencesError,
	NumericValueMismatchError,
	NumericValueOutOfRangeError,
	RuleNotFoundError
};
