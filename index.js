var RulesList = require('./lib/rules-list');

function parse(abnf_string, rules_list) {
	return RulesList.fromABNFString(abnf_string, rules_list);
}

module.exports = {
	parse
};
