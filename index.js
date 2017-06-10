var
	RulesList = require('./lib/rules-list'),
	Core      = require('./lib/core'),
	FS        = require('fs');

function parse(abnf_string, rules_list) {
	return RulesList.fromABNFString(abnf_string, rules_list);
}

function parseRule(abnf_string, rules_list) {
	return parse(abnf_string, rules_list).getFirstRule();
}

function readABNFFile(filename) {
	var path = `./abnf/${filename}.abnf`;

	return FS.readFileSync(path, 'utf8');
}

function getSpec() {
	return readABNFFile('abnf');
}

var
	core_rules_abnf = readABNFFile('core-rules'),
	core_rules      = RulesList.fromABNFString(core_rules_abnf);


Core.setRulesList(core_rules);


module.exports = {
	parse,
	parseRule,
	getSpec
};
