
var
	Rule              = require('./rule'),
	extend            = require('./utilities/extend'),
	RuleNotFoundError = require('./errors/rule-not-found');


var standardizeRuleName = require('./utilities/standardize-rule-name');


class RuleList {

	setABNFString(abnf_string) {
		this.abnf_string = abnf_string;
		return this;
	}

	getABNFString() {
		return this.abnf_string;
	}

	setExternalRuleList(external_rule_list) {
		if (!external_rule_list) {
			// If an undefined value is supplied, standardize it to null
			// instead, because we do a strict equality check against a null
			// value to determine whether an external rule list has been set
			// (see hasExternalRuleList() below):
			this.external_rule_list = null;
			return this;
		}

		if (!(external_rule_list instanceof RuleList)) {
			throw new Error(
				'Invalid rules list specified; must be instance of RuleList'
			);
		}

		this.external_rule_list = external_rule_list;
		return this;
	}

	getExternalRuleList() {
		return this.external_rule_list;
	}

	hasExternalRuleList() {
		return this.getExternalRuleList() !== null;
	}

	generate() {
		var
			lines                = this.getABNFString().split('\n'),
			previous_indentation = null,
			line_group           = [ ];

		lines.forEach(function each(line) {
			// Grab the current line's indentation before trimming:
			var indentation = this.getIndentationForLine(line);

			line = line.trim();

			if (!line) {
				// Bypass whitespace lines:
				return;
			}

			// Slightly tricky thing here. This handles the case where
			// previous_indentation hasn't been set to a numeric value yet,
			// because 0 > null === false.
			if (indentation > previous_indentation) {
				line_group.push(line);
			} else {
				if (line[0] === ';') {
					// Bypass lines starting with a semicolon:
					return;
				}

				if (line_group.length) {
					this.generateRuleFromLines(line_group);
				}

				line_group = [line];
				previous_indentation = indentation;
			}
		}, this);

		// Handle any stragglers:
		if (line_group.length) {
			this.generateRuleFromLines(line_group);
		}

		return this;
	}

	getIndentationForLine(line) {
		var match = line.match(/^[\s\t]+/);

		if (!match) {
			return '';
		}

		return match[0];
	}

	addRule(rule) {
		var
			rules      = this.getRules(),
			rule_names = this.getRuleNames(),
			rule_name  = rule.getName();

		rules[rule_name] = rule;
		rule_names.push(rule_name);

		return this;
	}

	addIncrementalAlternative(incremental_rule) {
		var
			rule_name     = incremental_rule.getName(),
			existing_rule = this.getRuleByName(rule_name);

		if (!existing_rule) {
			throw new Error(`
				Tried to add incremental alternative for rule ${rule_name},
				but no prior rule definition was found
			`);
		}

		existing_rule.addAlternative(incremental_rule);

		return this;
	}

	getRules() {
		if (!this.rules) {
			this.rules = { };
		}

		return this.rules;
	}

	getRuleNames() {
		if (!this.rule_names) {
			this.rule_names = [ ];
		}

		return this.rule_names;
	}

	getRuleByName(rule_name) {
		var
			standardized_rule_name = standardizeRuleName(rule_name),
			rule                   = this.getRules()[standardized_rule_name];

		if (!rule) {
			rule = this.getExternalRuleByName(standardized_rule_name);
		}

		if (!rule) {
			throw new RuleNotFoundError(rule_name, null);
		}

		return rule;
	}

	getExternalRuleByName(rule_name) {
		if (!this.hasExternalRuleList()) {
			return null;
		}

		return this.getExternalRuleList().getRule(rule_name);
	}

	/**
	 * Shortcut convenience alias for getRuleByName().
	 *
	 * @param   {string} rule_name
	 * @returns {lib/rule}
	 */
	getRule(rule_name) {
		return this.getRuleByName(rule_name);
	}

	generateRuleFromLines(abnf_lines) {
		var rule = Rule.fromABNFLines(abnf_lines, this);

		if (rule.isIncrementalAlternative()) {
			this.addIncrementalAlternative(rule);
		} else {
			this.addRule(rule);
		}

		return this;
	}

	getFirstRule() {
		var rule_name = this.getFirstRuleName();

		return this.getRuleByName(rule_name);
	}

	getFirstRuleName() {
		return this.getRuleNames()[0];
	}

	hasRuleName(rule_name) {
		var standardized_rule_name = standardizeRuleName(rule_name);

		return this.getRuleNames().indexOf(standardized_rule_name) !== -1;
	}

	matchRuleName(rule_name, input) {
		return this.getRuleByName(rule_name).match(input);
	}

	match(input) {
		return this.getFirstRule().match(input);
	}

}

extend(RuleList.prototype, {
	rules:              null,
	rule_names:         null,
	external_rule_list: null,
	abnf_string:        null
});

RuleList.fromString = function fromString(abnf_string, rule_list) {
	return (new RuleList())
		.setABNFString(abnf_string)
		.setExternalRuleList(rule_list)
		.generate();
};

module.exports = RuleList;
