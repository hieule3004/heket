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
 * 6. RulesList (lib/rules-list)
 *
 * The RulesList class is a collection of related rules. By creating an external
 * linkage between all of the rules in a top-level ABNF specification, the
 * RulesList enables each rule to reference any other rule in the specification.
 * You can also append rules from other specifications, as well.
 *
 *
 * 7. Unparser (lib/unparser)
 *
 * Like the Parser, but in reverse. This class uses its corresponding ABNF AST
 * to produce an output string matching the grammar. It will prompt the consumer
 * for the value of any rule name that it encounters as it traverses the AST.
 *
 */



var
	Parser    = require('./lib/parser'),
	RulesList = require('./lib/rules-list'),
	Core      = require('./lib/core'),
	FS        = require('fs'),
	Path      = require('path');

var
	InvalidRuleValueError = require('./lib/errors/invalid-rule-value'),
	MissingRuleValueError = require('./lib/errors/missing-rule-value');

/**
 * Creates a parser for the specified ABNF string and (optional) rules list.
 *
 * @param   {string} abnf_string
 * @param   {lib/rules-list|void} rules_list
 * @returns {lib/parser}
 */
function createParser(abnf_string, rules_list) {
	return Parser.fromString(abnf_string, rules_list);
}

/**
 * Creates an unparser for the specified ABNF string and (optional) rules list.
 *
 * @param   {string} abnf_string
 * @param   {lib/rules-list|void} rules_list
 * @returns {lib/unparser}
 */
function createUnparser(abnf_string, rules_list) {
	return createParser(abnf_string, rules_list).getUnparser();
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
var core_rules = RulesList.fromString(readABNFFile('core-rules'));

Core.setRulesList(core_rules);


module.exports = {
	createParser,
	createUnparser,
	readABNFFile,
	getSpec,
	InvalidRuleValueError,
	MissingRuleValueError
};
