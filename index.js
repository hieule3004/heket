var
	Parser    = require('./lib/parser'),
	RulesList = require('./lib/rules-list'),
	Core      = require('./lib/core'),
	FS        = require('fs'),
	Path      = require('path');

var
	InvalidRuleValueError = require('./lib/errors/invalid-rule-value'),
	MissingRuleValueError = require('./lib/errors/missing-rule-value');

function createParser(abnf_string, rules_list) {
	return Parser.fromString(abnf_string, rules_list);
}

function createUnparser(abnf_string, rules_list) {
	return createParser(abnf_string, rules_list).getUnparser();
}

function readABNFFile(filename) {
	var path = Path.resolve(__dirname, `./abnf/${filename}.abnf`);

	return FS.readFileSync(path, 'utf8');
}

function getSpec() {
	return readABNFFile('abnf');
}

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
