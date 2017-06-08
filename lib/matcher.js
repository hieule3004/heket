
var
	extend = require('./utilities/extend');


var UNIQUE_ID = 0;

class Matcher {

	constructor() {
		this.setId(UNIQUE_ID++);
	}

	getId() {
		return this.id;
	}

	setId(id) {
		this.id = id;
		return this;
	}

	setRule(rule) {
		return this.setNode(rule.getAST());
	}

	getNode() {
		return this.node;
	}

	setNode(node) {
		this.node = node;
		return this;
	}

	getChildNodes() {
		return this.getNode().getChildNodes();
	}

	getChildNodeAtIndex(index) {
		return this.getChildNodes()[index];
	}

	getIndexOfChildNode(child_node) {
		return this.getChildNodes().indexOf(child_node);
	}

	getChildIndex() {
		return this.child_index;
	}

	setChildIndex(child_index) {
		this.child_index = child_index;
		return this;
	}

	incrementChildIndex() {
		return this.setChildIndex(this.getChildIndex() + 1);
	}

	getChildAtIndex(index) {
		var node = this.getChildNodeAtIndex(index);

		return this.getChildForNode(node);
	}

	getIndexOfChild(child) {
		return this.getIndexOfChildNode(child.getNode());
	}

	getChildren() {
		if (!this.children) {
			this.children = { };
		}

		return this.children;
	}

	getChildForNode(node) {
		var
			node_id  = node.getId(),
			children = this.getChildren();

		if (!children[node_id]) {
			children[node_id] = (new Matcher()).setNode(node);
		}

		return children[node_id];
	}

	getCurrentChild() {
		return this.getChildForNode(this.getCurrentChildNode());
	}

	getFirstChild() {
		return this.getChildForNode(this.getFirstChildNode());
	}

	getCurrentChildNode() {
		return this.getChildNodes()[this.getChildIndex()];
	}

	getFirstChildNode() {
		return this.getChildNodes()[0];
	}

	getChildCount() {
		return this.getChildNodes().length;
	}

	getQuotedString() {
		return this.getNode().getQuotedString();
	}

	getPriorChildWithRemainingAlternatives() {
		var index = this.getChildIndex();

		while (index--) {
			let child = this.getChildAtIndex(index);

			if (child.hasRemainingAlternatives()) {
				return child;
			}
		}

		return null;
	}

	getResultsForChild(child) {
		return child.getResults();
	}

	addResultForChild(result, child) {
		child.addResult(result);
		return this;
	}

	getResults() {
		if (!this.results) {
			this.results = [ ];
		}

		return this.results;
	}

	getResultsCount() {
		return this.getResults().length;
	}

	addResult(result) {
		this.getResults().push(result);
		return this;
	}

	getRule() {
		return this.getNode().getRule();
	}

	getRuleName() {
		return this.getNode().getRuleName();
	}

	getMinRepeats() {
		return this.getNode().getMinRepeats();
	}

	getMaxRepeats() {
		if (this.max_repeats === null) {
			this.max_repeats = this.getNode().getMaxRepeats();
		}

		return this.max_repeats;
	}

	setMaxRepeats(max_repeats) {
		this.max_repeats = max_repeats;
		return this;
	}

	decrementMaxRepeats() {
		this.setMaxRepeats(this.getMaxRepeats() - 1);
	}

	getRepeatCount() {
		return this.repeat_count;
	}

	setRepeatCount(repeat_count) {
		this.repeat_count = repeat_count;
		return this;
	}

	incrementRepeatCount() {
		return this.setRepeatCount(this.getRepeatCount() + 1);
	}

	getNumberOfChildrenWithResults() {
		if (!this.hasChildren()) {
			return 0;
		}

		var count = 0;

		this.iterateOverChildren(function iterate(child) {
			if (this.hasResultForChild(child)) {
				count++;
			}
		});

		return count;
	}

	getRequiredNumberOfChildrenWithResults() {
		if (!this.hasChildren()) {
			return 0;
		}

		if (this.hasAlternatives()) {
			// TODO: Add note about exception case for repeating clause
			return 1;
		}

		return this.getChildCount();
	}

	getNumericSet() {
		return this.getNode().getNumericSet();
	}

	getNumericStartValue() {
		return this.getNode().getNumericStartValue();
	}

	getNumericEndValue() {
		return this.getNode().getNumericEndValue();
	}




	hasRuleName() {
		return this.getRuleName() !== null;
	}

	hasQuotedString() {
		return this.getNode().hasQuotedString();
	}

	hasAlternatives() {
		return this.getNode().hasAlternatives();
	}

	hasNumeric() {
		return this.getNode().hasNumeric();
	}

	hasNumericRange() {
		return this.getNode().hasNumericRange();
	}

	hasNumericSet() {
		return this.getNode().hasNumericSet();
	}

	hasChildren() {
		return this.getChildNodes().length > 0;
	}

	hasRemainingAlternatives() {
		if (this.hasAlternatives() && !this.isAtLastChild()) {
			return true;
		}

		if (this.isRepeating() && this.canDecrementMaxRepeats()) {
			return true;
		}

		return this.hasPriorChildWithRemainingAlternatives();
	}

	hasPriorChildWithRemainingAlternatives() {
		return this.getPriorChildWithRemainingAlternatives() !== null;
	}

	isAtLastChild() {
		return this.getChildIndex() === this.getChildCount() - 1;
	}

	hasRemainingChildren() {
		return !this.isAtLastChild();
	}

	isOptional() {
		return this.getNode().isOptional();
	}

	isRepeating() {
		return this.getNode().isRepeating();
	}

	canDecrementMaxRepeats() {
		return (
			   this.getMaxRepeats()  > this.getMinRepeats()
			&& this.getRepeatCount() > this.getMinRepeats()
		);
	}

	hasResultForChild(child) {
		return this.getResultsForChild(child).length > 0;
	}

	hasRequiredNumberOfChildrenWithResults() {
		var
			actual_count   = this.getNumberOfChildrenWithResults(),
			required_count = this.getRequiredNumberOfChildrenWithResults();

		return actual_count >= required_count;
	}




	createMatcherForChildNode(child_node) {
		return new Matcher().setNode(child_node);
	}

	matchString(string, allow_partial = false) {
		if (!string) {
			return null;
		}

		var result;

		if (this.hasRuleName()) {
			result = this.matchStringViaRuleName(string);
		} else if (this.hasQuotedString()) {
			result = this.matchStringViaQuotedString(string);
		} else if (this.hasNumeric()) {
			result = this.matchStringViaNumeric(string);
		} else if (this.isRepeating()) {
			result = this.matchStringViaRepetition(string);
		} else if (this.hasChildren()) {
			result = this.matchStringViaChildren(string);
		} else {
			throw new Error('implement');
		}

		if (!result) {
			return null;
		}

		if (!allow_partial && !this.compareStrings(result.string, string)) {
			return null;
		}

		return result;
	}

	matchStringViaRuleName(string) {
		var
			allow_partial = true,
			rule          = this.getRule(),
			match         = rule.match(string, allow_partial);

		if (!match) {
			return null;
		}

		return {
			rule_name: this.getRuleName(),
			string:    match.string,
			rules:     match.rules
		};
	}

	matchStringViaQuotedString(string) {
		var
			lowercase_string        = string.toLowerCase(),
			lowercase_quoted_string = this.getQuotedString().toLowerCase();

		if (lowercase_string.indexOf(lowercase_quoted_string) !== 0) {
			return null;
		}

		return {
			string: string.slice(0, lowercase_quoted_string.length),
			rules:  [ ]
		};
	}

	matchStringViaNumeric(string) {
		if (this.hasNumericRange()) {
			return this.matchStringViaNumericRange(string);
		} else if (this.hasNumericSet()) {
			return this.matchStringViaNumericSet(string);
		} else {
			throw new Error('wat');
		}
	}

	matchStringViaNumericRange(string) {
		var char_code = string.charCodeAt(0);

		// NOTICE: This covers the case where the string is potentially empty.
		// "".charCodeAt(0) -> NaN
		if (!char_code) {
			return null;
		}

		if (char_code < this.getNumericStartValue()) {
			return null;
		}

		if (char_code > this.getNumericEndValue()) {
			return null;
		}

		return {
			string: string[0],
			rules:  [ ]
		};
	}

	matchStringViaNumericSet(string) {
		var set = this.getNumericSet();

		if (string.length < set.length) {
			return null;
		}

		var index = 0;

		while (index < set.length) {
			let
				numeric_value = set[index],
				char_code     = string.charCodeAt(index);

			if (char_code !== numeric_value) {
				return null;
			}

			index++;
		}

		return {
			string: string.slice(0, set.length),
			rules:  [ ]
		};
	}

	matchStringViaRepetition(string) {
		var child = this.getFirstChild();

		while (this.getRepeatCount() < this.getMaxRepeats()) {
			child.resetChildIndex();

			let match = child.matchString(string, true);

			if (!match) {
				break;
			}

			this.addResultForChild(match, child);
			this.incrementRepeatCount();

			string = string.slice(match.string.length);
		}

		if (this.getRepeatCount() < this.getMinRepeats()) {
			return null;
		}

		return {
			string: this.buildStringFromResults(),
			rules:  this.buildRulesFromResults()
		};
	}

	matchStringViaChildren(string) {
		if (this.hasAlternatives()) {
			return this.matchStringViaAlternativeChildren(string);
		} else {
			return this.matchStringViaSequentialChildren(string);
		}
	}

	matchStringViaAlternativeChildren(string) {
		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = child.matchString(string);

			if (match) {
				return match;
			}

			this.moveToNextChild();
		}

		return null;
	}

	matchStringViaSequentialChildren(string) {
		var original_string = string;

		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = child.matchString(string, true);

			if (!match) {
				if (child.isOptional()) {
					this.moveToNextChild();
					continue;
				}

				if (this.backtrackToPriorAlternative()) {
					let result_string = this.buildStringFromResults();

					string = original_string.slice(result_string.length);

					continue;
				} else {
					return null;
				}
			}

			string = string.slice(match.string.length);

			this.addResultForChild(match, child);
			this.moveToNextChild();
		}

		return {
			string: this.buildStringFromResults(),
			rules:  this.buildRulesFromResults()
		};
	}

	backtrackToPriorAlternative() {
		var prior_child = this.getPriorChildWithRemainingAlternatives();

		if (!prior_child) {
			return false;
		}

		var index = this.getIndexOfChild(prior_child);

		this.setChildIndex(index);

		prior_child.moveToNextAlternative();

		return true;
	}

	moveToNextAlternative() {
		this.resetResults();

		if (this.hasAlternatives() && this.hasRemainingChildren()) {
			return this.moveToNextChild();
		}

		if (this.isRepeating() && this.canDecrementMaxRepeats()) {
			this.resetRepeatCount();
			this.decrementMaxRepeats();
			return this;
		}

		throw new Error('implement');
	}

	moveToNextChild() {
		this.incrementChildIndex();
	}

	printNode() {
		console.log(JSON.stringify(this.getNode().toJSON(), null, 4));
	}

	iterateOverChildren(callback) {
		var
			children = this.getChildren(),
			key;

		for (key in children) {
			callback.call(this, children[key]);
		}

		return this;
	}

	iterateOverResults(callback) {
		return this.iterateOverChildren(function iterate(child) {
			var results = this.getResultsForChild(child);

			results.forEach(function each(result) {
				callback.call(this, child, result);
			}, this);
		});
	}

	buildStringFromResults() {
		var string = '';

		this.iterateOverResults(function iterate(child, result) {
			string += result.string;
		});

		return string;
	}

	buildRulesFromResults() {
		var rules = [ ];

		this.iterateOverResults(function iterate(child, result) {
			if (child.hasRuleName()) {
				rules.push(result);
			} else {
				rules = rules.concat(result.rules);
			}
		});

		return rules;
	}

	compareStrings(a, b) {
		return a.toLowerCase() === b.toLowerCase();
	}

	reset() {
		this.resetChildIndex();
		this.resetResults();
		this.resetRepeatCount();
	}

	resetChildIndex() {
		this.iterateOverChildren(function iterate(child) {
			child.resetChildIndex();
		});

		return this.setChildIndex(0);
	}

	resetResults() {
		this.iterateOverChildren(function iterate(child) {
			child.resetResults();
		});

		this.results = null;
		return this;
	}

	resetRepeatCount() {
		this.iterateOverChildren(function iterate(child) {
			child.resetRepeatCount();
		});

		this.setRepeatCount(0);
	}

}

extend(Matcher.prototype, {
	id:           null,
	children:     null,
	child_index:  0,
	node:         null,
	results:      null,
	repeat_count: 0,
	max_repeats:  null
});


module.exports = Matcher;
