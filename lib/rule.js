
var
	extend              = require('./utilities/extend'),
	standardizeRuleName = require('./utilities/standardize-rule-name'),
	Node                = require('./node');


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
			abnf_string = lines.join(' '),
			parts       = abnf_string.split('='),
			name        = parts[0].trim();

		this.setName(name);

		parts = parts[1].split(';');

		if (parts.length === 2) {
			let comment = parts[1].trim();

			this.setComment(comment);
		}

		var definition = parts[0].trim();

		return this.setDefinition(definition).generateAST();
	}

	parse(input) {

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

		return this;
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
