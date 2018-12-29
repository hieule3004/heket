
var
	extend                     = require('./utilities/extend'),
	standardizeRuleName        = require('./utilities/standardize-rule-name'),
	CircularRuleReferenceError = require('./errors/circular-rule-reference'),
	Node                       = require('./node'),
	Matcher                    = require('./matcher');


class Rule {

	setABNFLines(abnf_lines) {
		this.abnf_lines = abnf_lines;
		return this;
	}

	getABNFLines() {
		return this.abnf_lines;
	}

	setRuleList(rule_list) {
		this.rule_list = rule_list;
		return this;
	}

	getRuleList() {
		return this.rule_list;
	}

	generate() {
		var comment_lines = [ ];

		var lines = this.getABNFLines().map(function map(line) {
			var semicolon_index = line.lastIndexOf(';');

			if (semicolon_index === -1) {
				return line;
			}

			var
				within_quoted_string = false,
				index                = 0;

			while (index < line.length) {
				let character = line[index];

				if (character === '"') {
					within_quoted_string = !within_quoted_string;
				}

				if (character === ';' && !within_quoted_string) {

					let comment = line.slice(index + 1);

					line = line.slice(0, index);

					comment_lines.push(comment.trim());

					break;
				}

				index++;
			}

			return line;
		});

		if (comment_lines.length) {
			let comment = comment_lines.join(' ').trim();

			if (comment) {
				this.setComment(comment);
			}
		}

		var
			abnf_string  = lines.join(' '),
			equals_index = abnf_string.indexOf('=');

		if (equals_index === -1) {
			throw new Error(`Invalid ABNF definition: ${abnf_string}`);
		}

		var name = abnf_string.slice(0, equals_index).trim();

		if (!name) {
			throw new Error(`No rule name specified: ${abnf_string}`);
		}

		this.validateName(name);
		this.setName(name);

		var definition = abnf_string.slice(equals_index + 1);

		if (definition[0] === '/') {
			this.setIsIncrementalAlternative();
			definition = definition.slice(1);
		}

		definition = definition.trim();

		if (!definition) {
			throw new Error(`Invalid ABNF definition: ${abnf_string}`);
		}

		this.setDefinition(definition);
		this.setNode(this.generateNode());

		return this;
	}

	match(input, allow_partial = false) {
		return (new Matcher())
			.setRule(this)
			.matchString(input, allow_partial);
	}

	setName(name) {
		name = standardizeRuleName(name);

		this.name = name;

		return this;
	}

	setComment(comment) {
		this.comment = comment;
		return this;
	}

	getComment() {
		return this.comment;
	}

	validateName(name) {
		var first_letter = name[0];

		if (/[a-zA-Z]/.test(first_letter) === false) {
			throw new Error(
				`Invalid rule name: ${name} (must start with a letter)`
			);
		}

		if (/^[A-Za-z0-9\-]+$/.test(name) === false) {
			throw new Error(`
				Invalid rule name: ${name}
				(can only contain letters, numbers, and hyphens)
			`);
		}
	}

	getName() {
		return this.name;
	}

	setDefinition(definition) {
		this.definition = definition;
		return this;
	}

	getDefinition() {
		return this.definition;
	}

	generateNode() {
		return Node.fromString(this.getDefinition())
			.setRuleListRecursive(this.getRuleList())
			.setParentRuleName(this.getName());
	}

	setNode(node) {
		this.node = node;
		return this;
	}

	getNode() {
		return this.node;
	}

	setIsIncrementalAlternative(is_incremental_alternative = true) {
		this.is_incremental_alternative = is_incremental_alternative;
		return this;
	}

	isIncrementalAlternative() {
		return this.is_incremental_alternative;
	}

	addAlternative(rule) {
		this.getNode().addAlternative(rule.getNode());
		return this;
	}

	/**
	 * Whether or not this rule corresponds to an immutable AST definition;
	 * For instance, this rule from the ABNF core rules list has a fixed value:
	 *
	 * 	   SP = %x20 ; single space character
	 *
	 * When the value for a rule is known, we can bypass certain logic by just
	 * returning the fixed value directly.
	 *
	 * @returns {boolean}
	 */
	hasFixedValue() {
		return this.getNode().hasFixedValue();
	}

	getFixedValue() {
		return this.getNode().getFixedValue();
	}

	hasRegexString() {
		return this.regex_string !== null;
	}

	hasSimpleRegexString() {
		return this.simple_regex_string !== null;
	}

	getRegexString() {
		if (this.regex_string) {
			return this.regex_string;
		}

		var node = this.getNode();

		this.regex_group_rule_names = [ ];

		try {
			this.regex_string = node.generateRegexString(
				null,
				this.regex_group_rule_names,
				false
			);
		} catch (error) {
			if (error instanceof CircularRuleReferenceError) {
				this.setHasCircularReferences(true);
			}

			throw error;
		}

		return this.regex_string;
	}

	getSimpleRegexString() {
		if (this.simple_regex_string) {
			return this.simple_regex_string;
		}

		var node = this.getNode();

		try {
			this.simple_regex_string = node.generateRegexString(
				null,
				null,
				true
			);
		} catch (error) {
			if (error instanceof CircularRuleReferenceError) {
				this.setHasCircularReferences(true);
			}

			throw error;
		}

		return this.simple_regex_string;
	}

	getRegex() {
		if (!this.regex) {
			this.regex = new RegExp('^' + this.getRegexString() + '$');
		}

		return this.regex;
	}

	hasCircularReferences() {
		return this.has_circular_references;
	}

	setHasCircularReferences(has_circular_references) {
		this.has_circular_references = has_circular_references;
		return this;
	}

	getRegexGroupRuleNames() {
		return this.regex_group_rule_names;
	}

}

extend(Rule.prototype, {
	abnf_string:                null,
	rule_list:                  null,
	name:                       null,
	comment:                    null,
	definition:                 null,
	node:                       null,
	is_incremental_alternative: false,

	regex:                      null,
	regex_string:               null,
	simple_regex_string:        null,
	regex_group_rule_names:     null,
	has_circular_references:    false
});

Rule.fromABNFLines = function fromABNFLines(abnf_lines, rule_list) {
	return (new Rule())
		.setABNFLines(abnf_lines)
		.setRuleList(rule_list)
		.generate();
};

Rule.fromABNFString = function fromABNFString(abnf_string, rule_list) {
	var abnf_lines = abnf_string.split('\n');

	return Rule.fromABNFLines(abnf_lines, rule_list);
};

module.exports = Rule;
