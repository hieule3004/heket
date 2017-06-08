
var RULES_LIST = null;

function setRulesList(rules_list) {
	RULES_LIST = rules_list;
}

function getRulesList(rules_list) {
	return RULES_LIST;
}

module.exports = {
	setRulesList,
	getRulesList
};
