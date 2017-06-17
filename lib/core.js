/**
 * This file is a singleton; it's purpose is to circumvent a circular
 * dependency issue between the rules list module (lib/rules-list) and the
 * ABNF parser (lib/parser) necessary to produce the rules list from the core
 * ABNF file (abnf/core-rules). Chicken and the egg kind of thing.
 */


/* @param   {lib/rules-list} */
var RULES_LIST = null;



/**
 * Sets the core rules list within this singleton.
 *
 * @param   {lib/rules-list} rules_list
 * @returns {void}
 */
function setRulesList(rules_list) {
	RULES_LIST = rules_list;
}

/**
 * Retrieves the core rules list.
 *
 * @returns {lib/rules-list}
 */
function getRulesList() {
	return RULES_LIST;
}

module.exports = {
	setRulesList,
	getRulesList
};
