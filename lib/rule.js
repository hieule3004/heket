
var
	extend              = require('./utilities/extend'),
	standardizeRuleName = require('./utilities/standardize-rule-name'),
	Node                = require('./node'),
	Matcher             = require('./matcher');


class Rule {

	setABNFLines(abnf_lines) {
		this.abnf_lines = abnf_lines;
		return this;
	}

	getABNFLines() {
		return this.abnf_lines;
	}

	setRulesList(rules_list) {
		this.rules_list = rules_list;
		return this;
	}

	getRulesList() {
		return this.rules_list;
	}

	generate() {
		var comment_lines = [ ];

		var lines = this.getABNFLines().map(function map(line) {
			var semicolon_index = line.lastIndexOf(';');

			if (semicolon_index !== -1) {
				let comment_line = line.slice(semicolon_index);

				comment_lines.push(comment_line);

				line = line.slice(0, semicolon_index);
			}

			return line;
		});

		if (comment_lines.length) {
			this.setComment(comment_lines.join(' '));
		}

		var
			abnf_string  = lines.join(' '),
			equals_index = abnf_string.indexOf('=');

		if (equals_index === -1) {
			throw new Error(`Invalid ABNF definition: ${abnf_string}`);
		}

		var name = abnf_string.slice(0, equals_index).trim();

		this.setName(name);


		var
			definition      = abnf_string.slice(equals_index + 1),
			semicolon_index = definition.lastIndexOf(';');

		// TODO: More robust logic for checking whether the last semicolon
		// occurs within a quoted string, in which case we should bypass
		// this comment parsing logic.
		if (semicolon_index !== -1) {
			definition = definition.slice(0, semicolon_index);

			let comment = definition.slice(semicolon_index + 1);

			this.setComment(comment);
		}

		definition = definition.trim();

		if (definition.indexOf('(') !== -1 && definition.indexOf(')') === -1) {
			throw new Error('Invalid string: ' + definition);
		}

		return this.setDefinition(definition).generateAST();
	}

	match(input, allow_partial = false) {
		return (new Matcher())
			.setRule(this)
			.matchString(input, allow_partial);
	}

	setName(name) {
		name = standardizeRuleName(name);

		this.validateName(name);
		this.name = name;

		return this;
	}

	setComment(comment) {
		this.comment = comment;
		return this;
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

	generateAST() {
		this.ast = Node.fromString(this.getDefinition());

		this.ast.setRulesListRecursive(this.getRulesList());

		return this;
	}

	getAST() {
		return this.ast;
	}

}

extend(Rule.prototype, {
	abnf_string: null,
	rules_list:  null,
	name:        null,
	comment:     null,
	definition:  null,
	ast:         null
});

Rule.fromABNFLines = function fromABNFLines(abnf_lines, rules_list) {
	return (new Rule())
		.setABNFLines(abnf_lines)
		.setRulesList(rules_list)
		.generate();
};

Rule.fromABNFString = function fromABNFString(abnf_string, rules_list) {
	var abnf_lines = abnf_string.split('\n');

	return Rule.fromABNFLines(abnf_lines, rules_list);
};

module.exports = Rule;
