
var
	extend   = require('./utilities/extend'),
	contains = require('./utilities/contains');

var
	Core = require('./core');


const BASES = {
	BINARY:      'b',
	DECIMAL:     'd',
	HEXADECIMAL: 'x'
};

const NUMERIC_DIGITS = {
	[BASES.BINARY]:      ['0', '1'],
	[BASES.DECIMAL]:     ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
	[BASES.HEXADECIMAL]: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
};

var CURRENT_ID = 0;


class Node {

	constructor() {
		this.assignId();
	}

	assignId() {
		this.setId(CURRENT_ID++);
	}

	setId(id) {
		this.id = id;
		return this;
	}

	getId() {
		return this.id;
	}

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
			let substring = this.string.slice(this.index);

			throw new Error(`Invalid quotes: ${substring}`);
		}

		var child_node = (new Node())
			.setString('"' + token + '"')
			.setQuotedString(token);

		return this.addChildNode(child_node);
	}

	getDecimalValueForNumericTokenAndBase(token, base) {
		switch (base) {
			case BASES.BINARY:
				return parseInt(token, 2);

			case BASES.DECIMAL:
				return parseInt(token, 10);

			case BASES.HEXADECIMAL:
				return parseInt(token, 16);

			default:
				throw new Error(
					`Unsupported base specified: ${base}`
				);
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
			nodes        = [ ],
			current_node = (new Node()).setNumericBase(base),
			token        = '';

		while (this.index < this.string.length) {
			let
				character  = this.string[this.index],
				// Fuck JavaScript. No elegant way to break out of a while loop
				// from within a switch block...
				break_loop = false;

			switch (character) {
				case '.':
					if (current_node.hasNumericRange()) {
						current_node.setNumericEndToken(token);
						nodes.push(current_node);
						current_node = (new Node()).setNumericBase(base);
					} else {
						current_node.addNumericSetToken(token);
					}

					token = '';
					break;

				case '-':
					current_node.setNumericStartToken(token);
					token = '';
					break;

				case '/':
				case ' ':
					break_loop = true;
					break;

				default:
					// Just in case they specified a lowercase a-f in a hex
					// base numeric:
					character = character.toUpperCase();

					if (!contains(allowed_digits, character)) {
						throw new Error(`
							Invalid ${base} numeric
							(got illegal character ${character})
						`);
					}

					token += character;
					break;
			}

			if (break_loop) {
				break;
			}

			this.index++;
		}

		if (current_node.hasNumericRange()) {
			current_node.setNumericEndToken(token);
		} else {
			current_node.addNumericSetToken(token);
		}

		if (!nodes.length) {
			return this.addChildNode(current_node);
		}

		nodes.push(current_node);

		var group_node = new Node();

		nodes.forEach(function each(node) {
			group_node.addChildNode(node);
		});

		return this.addChildNode(group_node);
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
			} else if (!/[0-9]/.test(character)) {
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

			min_repeats = parseInt(parts[0]) || 0;
			max_repeats = parseInt(parts[1]) || Infinity;
		}

		var node = new Node();

		node.setMinRepeats(min_repeats)
			.setMaxRepeats(max_repeats);

		return this.setQueuedRepeat(node);
	}

	addAlternative(alternative_node) {
		if (!this.hasAlternatives()) {
			this.groupChildNodes();
			this.setHasAlternatives();
		}

		return this.addChildNode(alternative_node);
	}

	parseAlternative() {


		// Advance past the initial "/" signifier:
		this.index++;

		var
			token                = '',
			within_quoted_string = false;

		while (this.index < this.string.length) {
			let character = this.string[this.index];

			if (character === '/' && !within_quoted_string) {
				break;
			}

			if (character === '"') {
				within_quoted_string = !within_quoted_string;
			}

			token += character;

			this.index++;
		}

		var child_node = Node.fromString(token);

		return this.addAlternative(child_node);
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

		if (!/[A-Za-z0-9\-]/.test(character)) {
			let substring = this.string.slice(this.index);

			throw new Error(
				`Invalid rule name: ${substring}
			`);
		}

		var token = '';

		while (this.index < this.string.length) {
			character = this.string[this.index];

			if (!/[A-Za-z0-9\-]/.test(character)) {
				break;
			}

			token += character;

			this.index++;
		}

		character = this.string[this.index];

		if (character === '>') {
			this.index++;
		}

		var node = (new Node())
			.setString('<' + token + '>')
			.setRuleName(token);

		this.addChildNode(node);

		return this;
	}

	isOptional() {
		return this.getMinRepeats() === 0;
	}

	isRequired() {
		return !this.isOptional();
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

	isEmptyWrapper() {
		if (!this.hasChildNodes()) {
			return false;
		}

		if (this.getChildNodes().length !== 1) {
			return false;
		}

		if (this.isRepeating()) {
			return false;
		}

		if (this.isOptional()) {
			return false;
		}

		return true;
	}

	getFirstChildNode() {
		return this.getChildNodes()[0];
	}

	addChildNode(child_node) {
		if (child_node.isEmptyWrapper()) {
			child_node = child_node.getFirstChildNode();
		}

		if (this.hasQueuedRepeat()) {
			child_node = this.applyQueuedRepeatToChildNode(child_node);
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

		queued_repeat.addChildNode(child_node);

		this.clearQueuedRepeat();

		return queued_repeat;
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

	getRule() {
		return this.getRuleByName(this.getRuleName());
	}

	setNumericStartToken(start_token) {
		var value = this.getDecimalValueForNumericTokenAndBase(
			start_token,
			this.getNumericBase()
		);

		return this.setNumericStartValue(value);
	}

	setNumericEndToken(end_token) {
		var value = this.getDecimalValueForNumericTokenAndBase(
			end_token,
			this.getNumericBase()
		);

		return this.setNumericEndValue(value);
	}

	setNumericStartValue(start_value) {
		this.numeric_start_value = start_value;
		return this;
	}

	getNumericStartValue() {
		return this.numeric_start_value;
	}

	hasNumericStartValue() {
		return this.getNumericStartValue() !== null;
	}

	setNumericEndValue(end_value) {
		this.numeric_end_value = end_value;
		return this;
	}

	getNumericEndValue() {
		return this.numeric_end_value;
	}

	setNumericBase(numeric_base) {
		this.numeric_base = numeric_base;
		return this;
	}

	getNumericBase() {
		return this.numeric_base;
	}

	hasNumericRange() {
		return this.hasNumericStartValue();
	}

	hasNumericSet() {
		return this.getNumericSet() !== null;
	}

	getNumericSet() {
		return this.numeric_set;
	}

	addNumericSetToken(set_token) {
		if (!this.numeric_set) {
			this.numeric_set = [ ];
		}

		var value = this.getDecimalValueForNumericTokenAndBase(
			set_token,
			this.getNumericBase()
		);

		this.numeric_set.push(value);
	}

	hasNumeric() {
		return this.hasNumericRange() || this.hasNumericSet();
	}

	toJSON(recursive = false, seen_nodes) {
		if (!seen_nodes) {
			seen_nodes = [ ];
		}

		seen_nodes.push(this.getId());

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

		if (this.hasNumericRange()) {
			result.numeric_start_value = this.numeric_start_value;
			result.numeric_end_value = this.numeric_end_value;
		}

		if (this.hasNumericSet()) {
			result.numeric_set = this.numeric_set;
		}

		if (this.hasAlternatives()) {
			result.has_alternatives = true;
		}

		if (this.hasRuleName()) {
			result.rule_name = this.getRuleName();

			let
				linked_node    = this.getRule().getNode(),
				linked_node_id = linked_node.getId();

			if (seen_nodes.indexOf(linked_node_id) !== -1) {
				result.linked_node = '[circular]';
			} else if (recursive) {
				result.linked_node = linked_node.toJSON(recursive, seen_nodes);
			}
		}

		if (this.hasChildNodes()) {
			result.child_nodes = this.getChildNodes().map(function map(child_node) {
				let child_node_id = child_node.getId();

				if (seen_nodes.indexOf(child_node_id) !== -1) {
					return '[circular]';
				} else {
					return child_node.toJSON(recursive, seen_nodes);
				}
			});
		}

		return result;
	}

	getRuleByName(rule_name) {
		if (!rule_name) {
			throw new Error('Must specify a rule name');
		}

		if (this.isCoreRuleName(rule_name)) {
			return this.getCoreRulesList().getRuleByName(rule_name);
		}

		return this.getRulesList().getRuleByName(rule_name);
	}

	isCoreRuleName(rule_name) {
		if (rule_name !== rule_name.toUpperCase()) {
			return false;
		}

		var core_rules = this.getCoreRulesList();

		if (!core_rules) {
			return false;
		}

		return core_rules.hasRuleName(rule_name);
	}

	getCoreRulesList() {
		return Core.getRulesList();
	}

	getRulesList() {
		return this.rules_list;
	}

	setRulesList(rules_list) {
		this.rules_list = rules_list;

		return this;
	}

	setRulesListRecursive(rules_list) {
		this.setRulesList(rules_list);

		if (this.hasChildNodes()) {
			this.getChildNodes().forEach(function each(child_node) {
				child_node.setRulesListRecursive(rules_list);
			});
		}
	}

	setParent(parent_node) {
		this.parent = parent_node;
	}

	getParent() {
		return this.parent;
	}

}

extend(Node.prototype, {
	id:                  null,
	string:              null,
	index:               0,

	min_repeats:         1,
	max_repeats:         1,
	queued_repeat:       null,

	quoted_string:       null,

	child_nodes:         null,

	has_alternatives:    false,
	rule_name:           null,
	rules_list:          null,
	core_rules_list:     null,

	numeric_start_value: null,
	numeric_end_value:   null,
	numeric_base:        null,
	numeric_set:         null,

	parent:              null
});


Node.fromString = function fromString(string) {
	return (new Node())
		.setString(string)
		.parse();
};

module.exports = Node;
