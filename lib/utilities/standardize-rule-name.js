

/**
 * @param   {string} rule_name
 * @returns {string}
 */
function standardizeRuleName(rule_name) {
	if (rule_name[0] === '<' && rule_name[rule_name.length - 1] === '>') {
		rule_name = rule_name.slice(1, -1);
	}

	return rule_name.toLowerCase();
}

module.exports = standardizeRuleName;
