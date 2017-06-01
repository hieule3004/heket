
var
	extend   = require('./utilities/extend'),
	contains = require('./utilities/contains');


const BASES = {
	BINARY:      'b',
	DECIMAL:     'd',
	HEXADECIMAL: 'x'
};

const NUMERIC_DIGITS = {
	[BASES.BINARY]:      ['0', '1'],
	[BASES.DECIMAL]:     ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
	[BASES.HEXADECIMAL]: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A',' B', 'C', 'D', 'E', 'F']
};


class Node {

	setString(string) {
		this.string = string;
		return this;
	}

	parse() {
		while (this.index < this.string.length) {
			let character = this.string[this.index];

			switch (character) {
				case '(':
					this.parseGroup();
					break;

				case '[':
					this.parseOptional();
					break;

				case '"':
					this.parseString();
					break;

				case '%':
					this.parseNumeric();
					break;

				case '*':
				case '0':
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
					this.parseRepeat();
					break;

				case '/':
					this.parseAlternative();
					break;

				case ' ':
				case '\t':
					this.parseWhitespace();
					break;

				default:
					this.parseRuleName();
					break;
			}
		}

		return this;
	}

	parseGroup() {
		var
			token             = '',
			parentheses_count = 0;

		// Advance past the initial starting bracket:
		this.index++;

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			this.index++;

			if (character === ')') {
				if (parentheses_count === 0) {
					break;
				}

				parentheses_count--;
			} else if (character === '(') {
				parentheses_count++;
			}

			token += character;
		}

		if (parentheses_count !== 0) {
			throw new Error('invalid parentheses');
		}

		var child_node = Node.fromString(token);

		return this.addChildNode(child_node);
	}

	parseOptional() {
		var
			token         = '',
			bracket_count = 0;

		// Advance past the initial starting bracket:
		this.index++;

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			this.index++;

			if (character === ']') {
				if (bracket_count === 0) {
					break;
				}

				bracket_count--;
			} else if (character === '[') {
				bracket_count++;
			}

			token += character;
		}

		if (bracket_count !== 0) {
			throw new Error('invalid brackets');
		}

		var child_node = Node.fromString(token);

		child_node.setIsOptional();

		return this.addChildNode(child_node);
	}

	parseString() {
		var
			token            = '',
			found_end_quotes = false;

		// Advance past the initial double quotes:
		this.index++;

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			this.index++;

			if (character === '"') {
				found_end_quotes = true;
				break;
			}

			token += character;
		}

		if (!found_end_quotes) {
			throw new Error('invalid quotes');
		}

		var child_node = new Node();

		child_node.setQuotedString(token);

		return this.addChildNode(child_node);
	}

	addNodesToGroupForTokenRange(group_node, start_token, end_token) {
		if (!start_token) {
			start_token = end_token;
		}

		var
			current_token_value = this.getValueForNumericToken(start_token),
			end_token_value     = this.getValueFroNumericToken(end_token);

		while (current_token_value <= end_token_value) {
			let node = new Node();

			node.setNumericValue(current_token_value);
			group_node.addChildNode(node);

			current_token_value++;
		}
	}

	parseNumeric() {
		// Advance past the initial % signifier:
		this.index++;

		var base = this.string[this.index];

		// Advance past the base signifier:
		this.index++;

		var allowed_digits = NUMERIC_DIGITS[base];

		if (!allowed_digits) {
			throw new Error('Invalid base');
		}

		var
			group_node = new Node(),
			prior_token,
			token = '';

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			switch (character) {
				case '.':
					if (!token) {
						throw new Error('Invalid binary numeric');
					}

					this.addNodesToGroupForTokenRange(group_node, prior_token, token);
					token = '';
					break;

				case '-':
					if (!token) {
						throw new Error('Invalid binary numeric');
					}

					prior_token = token;
					token = '';
					break;

				case '/':
				case ' ':
					break;

				default:
					// Just in case they specified a lowercase a-f in a hex
					// base numeric:
					character = character.toUpperCase();

					if (!contains(allowed_digits, character)) {
						throw new Error('Invalid binary numeric');
					}

					token += character;
					break;
			}

			this.index++;
		}

		this.addNodesToGroupForTokenRange(group_node, prior_token, token);
		this.addChildNode(group_node);

		return this;
	}

	parseRepeat() {
		var
			token             = '',
			has_seen_asterisk = false;

		// NOTICE: We don't advance past the initial token in this case.

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			if (character === '*') {
				if (has_seen_asterisk) {
					throw new Error('invalid repeat');
				}

				has_seen_asterisk = true;
			} else if (!character.test(/[0-9]/)) {
				break;
			}

			token += character;

			// NOTICE: We increment the index *after* performing the token
			// concatenation, in the case of a repeat. This differs from
			// the behavior of the other parsing methods in this class,
			// because in the case of a repeat, there is no terminal
			// signifier to indicate the end of the repeat expression.
			// We have to deduce it by encountering a non-numeric character.
			this.index++;
		}

		var
			min_repeats,
			max_repeats;

		if (!has_seen_asterisk) {
			min_repeats = max_repeats = parseInt(token);
		} else {
			let parts = token.split('*');

			min_repeats = parts[0] || 0;
			max_repeats = parts[1] || Infinity;
		}

		var node = new Node();

		node.setIsRepeating()
			.setMinRepeats(min_repeats)
			.setMaxRepeats(max_repeats);

		return this.setQueuedRepeat(node);
	}

	parseAlternative() {
		if (!this.hasAlternatives()) {
			this.groupChildNodes();
			this.setHasAlternatives();
		}

		var token = '';

		// Advance past the initial "/" signifier:
		this.index++;

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			if (character === '/') {
				break;
			}

			token += character;

			this.index++;
		}

		var child_node = Node.fromString(token);

		return this.addChildNode(child_node);
	}

	parseWhitespace() {
		while (this.index < this.string.length) {
			let character = this.string[this.index];

			if (character !== ' ' && character !== '\t') {
				break;
			}

			this.index++;
		}

		return this;
	}

	parseRuleName() {
		var character = this.string[this.index];

		if (character === '<') {
			this.index++;
		}

		character = this.string[this.index];

		if (!/[A-Za-z]/.test(character)) {
			throw new Error('Invalid rule name');
		}

		var token = '';

		while (this.index < this.string.length) {
			character = this.string[this.index];

			if (!/[A-Za-z0-9]/.test(character)) {
				break;
			}

			token += character;

			this.index++;
		}

		character = this.string[this.index];

		if (character === '>') {
			this.index++;
		}

		var node = new Node();

		node.setRuleName(token);

		this.addChildNode(node);

		return this;
	}

	isOptional() {
		return this.getMinRepeats() === 0;
	}

	setIsOptional() {
		return this.setMinRepeats(0);
	}

	setMinRepeats(min_repeats) {
		this.min_repeats = min_repeats;
		return this;
	}

	setMaxRepeats(max_repeats) {
		this.max_repeats = max_repeats;
		return this;
	}

	getMinRepeats() {
		return this.min_repeats;
	}

	getMaxRepeats() {
		return this.max_repeats;
	}

	isRepeating() {
		return this.getMaxRepeats() > 1;
	}

	addChildNode(child_node) {
		if (this.hasQueuedRepeat()) {
			this.applyQueuedRepeatToChildNode(child_node);
		}

		if (!this.hasChildNodes()) {
			this.resetChildNodes();
		}

		child_node.setParent(this);

		this.getChildNodes().push(child_node);
		return this;
	}

	getChildNodeByIndex(index) {
		return this.getChildNodes()[index] || null;
	}

	setQueuedRepeat(queued_repeat) {
		this.queued_repeat = queued_repeat;
		return this;
	}

	getQueuedRepeat() {
		return this.queued_repeat;
	}

	clearQueuedRepeat() {
		return this.setQueuedRepeat(null);
	}

	hasQueuedRepeat() {
		return this.getQueuedRepeat() !== null;
	}

	applyQueuedRepeatToChildNode(child_node) {
		var queued_repeat = this.getQueuedRepeat();

		child_node
			.setMinRepeats(queued_repeat.getMinRepeats())
			.setMaxRepeats(queued_repeat.getMaxRepeats());

		return this.clearQueuedRepeat();
	}

	setQuotedString(quoted_string) {
		this.quoted_string = quoted_string;
		return this;
	}

	getQuotedString() {
		return this.quoted_string;
	}

	hasQuotedString() {
		return this.getQuotedString() !== null;
	}

	getChildNodes() {
		return this.child_nodes;
	}

	setChildNodes(child_nodes) {
		this.child_nodes = child_nodes;
	}

	resetChildNodes() {
		this.setChildNodes([ ]);
	}

	hasChildNodes() {
		return this.child_nodes !== null;
	}

	hasAlternatives() {
		return this.has_alternatives;
	}

	setHasAlternatives(has_alternatives = true) {
		this.has_alternatives = has_alternatives;
		return this;
	}

	groupChildNodes() {
		var node = new Node();

		node.setChildNodes(this.getChildNodes());

		this.resetChildNodes();

		// TODO: Ensure that no repeat is queued.

		return this.addChildNode(node);
	}

	setRuleName(rule_name) {
		this.rule_name = rule_name;
		return this;
	}

	getRuleName() {
		return this.rule_name;
	}

	hasRuleName() {
		return this.getRuleName() !== null;
	}

	setNumericValue(numeric_value) {
		this.numeric_value = numeric_value;
		return this;
	}

	getNumericValue() {
		return this.numeric_value;
	}

	hasNumericValue() {
		return this.getNumericValue() !== null;
	}

	toJSON() {
		var result = { };

		if (this.isOptional()) {
			result.is_optional = true;
		}

		if (this.isRepeating()) {
			result.min_repeats = this.min_repeats;
			result.max_repeats = this.max_repeats;
		}

		if (this.hasQuotedString()) {
			result.quoted_string = this.quoted_string;
		}

		if (this.hasAlternatives()) {
			result.has_alternatives = true;
		}

		if (this.hasRuleName()) {
			result.rule_name = this.getRuleName();
		}

		if (this.hasChildNodes()) {
			result.child_nodes = this.getChildNodes().map(function map(child_node) {
				return child_node.toJSON();
			});
		}

		return result;
	}

	getRuleByName(rule_name) {
		if (!rule_name) {
			throw new Error('Must specify a rule name');
		}

		return this.getRulesList().getRuleByName(rule_name);
	}

	getRulesList() {
		return this.rules_list;
	}

	setRulesList(rules_list) {
		this.rules_list = rules_list;
		return this;
	}

	setParent(parent_node) {
		this.parent = parent_node;
	}

	getParent() {
		return this.parent;
	}

}

extend(Node.prototype, {
	string:           null,
	index:            0,
	min_repeats:      1,
	max_repeats:      1,
	queued_repeat:    null,
	quoted_string:    null,
	child_nodes:      null,
	has_alternatives: false,
	rule_name:        null,
	numeric_value:    null,
	rules_list:       null,
	parent:           null
});


Node.fromString = function fromString(string) {
	return (new Node())
		.setString(string)
		.parse();
};

module.exports = Node;
