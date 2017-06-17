/**
 * This file is a singleton; it's purpose is to circumvent a circular
 * dependency issue between the rule list module (lib/rule-list) and the
 * ABNF parser (lib/parser) necessary to produce the rule list from the core
 * ABNF file (abnf/core-rules). Chicken and the egg kind of thing.
 */


/* @param   {lib/rule-list} */
var RULE_LIST = null;



/**
 * Sets the core rule list within this singleton.
 *
 * @param   {lib/rule-list} rule_list
 * @returns {void}
 */
function setRuleList(rule_list) {
	RULE_LIST = rule_list;
}

/**
 * Retrieves the core rule list.
 *
 * @returns {lib/rule-list}
 */
function getRuleList() {
	return RULE_LIST;
}

module.exports = {
	setRuleList,
	getRuleList
};
