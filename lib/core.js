/**
 * This file is a singleton; it's purpose is to circumvent a circular
 * dependency issue between the rule list module (lib/rule-list) and the
 * ABNF parser (lib/parser) necessary to produce the rule list from the core
 * ABNF file (abnf/core-rules). Chicken and the egg kind of thing.
 *
 * It also exposes the setting for whether or not to perform regex caching.
 */


/* @param   {lib/rule-list} */
var RULE_LIST = null;

/* @param   {boolean} */
var REGEX_CACHING_ENABLED = true;

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

/**
 * Disables regex caching. Regex caching can dramatically speed up performance,
 * but opens your program up to the risk of catastrophic backtracking in cases
 * where your input ABNF produces dangerous regex patterns.
 *
 * @returns {void}
 */
function disableRegexCaching() {
	REGEX_CACHING_ENABLED = false;
}

/**
 * Inverse of the above.
 *
 * @returns {void}
 */
function enableRegexCaching() {
	REGEX_CACHING_ENABLED = true;
}

/**
 * Whether regex caching is enabled.
 *
 * @returns {boolean}
 */
function isRegexCachingEnabled() {
	return REGEX_CACHING_ENABLED;
}

module.exports = {
	setRuleList,
	getRuleList,
	disableRegexCaching,
	enableRegexCaching,
	isRegexCachingEnabled
};
