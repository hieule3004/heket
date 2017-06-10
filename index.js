var
	Parser    = require('./lib/parser'),
	RulesList = require('./lib/rules-list'),
	Core      = require('./lib/core'),
	FS        = require('fs');

function createParser(abnf_string, rules_list) {
	return Parser.fromString(abnf_string, rules_list);
}

function readFile(filename) {
	var path = `./abnf/${filename}.abnf`;

	return FS.readFileSync(path, 'utf8');
}

function getSpec() {
	return readFile('abnf');
}

var core_rules = RulesList.fromString(readFile('core-rules'));

Core.setRulesList(core_rules);


module.exports = {
	createParser,
	getSpec
};
