
/**
 * Standardize a rule name so that lookups can be performed in a consistent way.
 * According to the spec, we should treat the following rules as the same:
 *
 * <rule-name>
 * <RULE-NAME>
 * rule-name
 * RuLe-NaMe
 *
 * @param   {string} rule_name
 * @returns {string}
 */
function standardizeRuleName(rule_name) {
	if (rule_name[0] === '<' && rule_name[rule_name.length - 1] === '>') {
		rule_name = rule_name.slice(1, -1);
	}

	rule_name = rule_name.replace(/-/g, '_');

	return rule_name.toLowerCase();
}

module.exports = standardizeRuleName;
