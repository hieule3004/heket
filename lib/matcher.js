
var
	extend = require('./utilities/extend');


var
	RuleNotFoundError           = require('./errors/rule-not-found'),
	InvalidRuleValueError       = require('./errors/invalid-rule-value'),
	InvalidQuotedStringError    = require('./errors/invalid-quoted-string'),
	MissingRuleValueError       = require('./errors/missing-rule-value'),
	NumericValueOutOfRangeError = require('./errors/numeric-value-out-of-range'),
	NumericValueMismatchError   = require('./errors/numeric-value-mismatch'),
	InputTooLongError           = require('./errors/input-too-long'),
	InputTooShortError          = require('./errors/input-too-short'),
	NotEnoughOccurrencesError   = require('./errors/not-enough-occurrences'),
	NoMatchingAlternativeError  = require('./errors/no-matching-alternative');

/**
 * This class is recursively instantiated when matching a specified string
 * to a rules list returned from parsing an ABNF grammar. An instance of this
 * class will be created for each node in the grammar AST. This allows us to
 * have a stateful way of iterating over each node in the AST, without having
 * to modify the nodes, as they'll most likely be used for other parsing
 * attempts afterwards and we don't want to pollute them.
 *
 * In that sense, you can think of this class as a wrapper around an AST node
 * to allow us some measure of persistent state when building up a match result.
 */
class Matcher {

	/**
	 * Sets the rule for this match instance. Really, this is just a convenience
	 * method for setting the underlying node from the rule.
	 *
	 * @param   {lib/rule} rule
	 * @returns {self}
	 */
	setRule(rule) {
		return this.setNode(rule.getNode());
	}

	/**
	 * Return the AST node that this match instance is associated with.
	 * The node is produced from parsing an ABNF grammar prior to the current
	 * match being performed.
	 *
	 * @returns {lib/node}
	 */
	getNode() {
		return this.node;
	}

	/**
	 * Sets the AST node that this match instance is associated with.
	 * This node is produced from parsing an ABNF grammar prior to the current
	 * match being performed.
	 *
	 * @param   {lib/node} node
	 * @returns {self}
	 */
	setNode(node) {
		this.node = node;
		return this;
	}

	/**
	 * Return the child nodes for the node that this match instance is
	 * associated with. (ie, this is just a shortcut)
	 *
	 * @returns {lib/node[]}
	 */
	getChildNodes() {
		return this.getNode().getChildNodes();
	}

	/**
	 * Returns the child node of our associated node at the specified index.
	 *
	 * @param   {int} index
	 * @returns {lib/node}
	 */
	getChildNodeAtIndex(index) {
		return this.getChildNodes()[index];
	}

	/**
	 * Returns the numeric index of the specified child node among all the other
	 * child nodes of our associated parent node.
	 *
	 * @param   {lib/node} child_node
	 * @returns {int}
	 */
	getIndexOfChildNode(child_node) {
		return this.getChildNodes().indexOf(child_node);
	}

	/**
	 * Returns the index of the child node we're currently examining.
	 * In other words, as we're determining whether the string we were given
	 * matches our child nodes in a recursive fashion, we need some way of
	 * remembering what child node we're currently looking at.
	 *
	 * @returns {int}
	 */
	getChildIndex() {
		return this.child_index;
	}

	/**
	 * Set the index of the child node we're currently examining. See the note
	 * above for more context on what this means.
	 *
	 * @param   {int} child_index
	 * @returns {self}
	 */
	setChildIndex(child_index) {
		this.child_index = child_index;
		return this;
	}

	/**
	 * Bump the index in order to start examining the next child node.
	 *
	 * @returns {self}
	 */
	incrementChildIndex() {
		return this.setChildIndex(this.getChildIndex() + 1);
	}

	/**
	 * Get the child match instance for the specified index.
	 * NOTICE: This will return another Match instance, not an AST node.
	 *
	 * We preserve an array of child nodes, because
	 *
	 * @param   {int} index
	 * @returns {lib/match}
	 */
	getChildAtIndex(index) {
		var node = this.getChildNodeAtIndex(index);

		return this.getChildForNode(node);
	}

	/**
	 * Returns the index of the specified child match instance.
	 * Since we don't store the child match instances of this match as an array
	 * (we use an object instead -- see references to "children" below), we
	 * check the index of the child's associated node instead.
	 *
	 * @param   {lib/match} child
	 * @returns {int}
	 */
	getIndexOfChild(child) {
		return this.getIndexOfChildNode(child.getNode());
	}

	/**
	 * Returns the match children for this match instance. We store these
	 * children as a map, keyed by each child's node id, instead of as
	 * an array. This is just to make it easier to retrieve a child from
	 * its associated node.
	 *
	 * If the child map doesn't exist yet, it will be lazily instantiated.
	 *
	 * @returns {object}
	 */
	getChildren() {
		if (!this.children) {
			this.children = { };
		}

		return this.children;
	}

	/**
	 * Returns the child match instance for the specified node.
	 * If the corresponding child match instance doesn't exist yet for the
	 * supplied node, it will be lazily instantiated.
	 *
	 * @param   {lib/node} node
	 * @returns {lib/match}
	 */
	getChildForNode(node) {
		var
			node_id  = node.getId(),
			children = this.getChildren();

		if (!children[node_id]) {
			// Create the child match if it doesn't exist yet.
			children[node_id] = (new Matcher()).setNode(node);
		}

		return children[node_id];
	}

	/**
	 * Get the match instance associated with the current child node.
	 *
	 * @returns {lib/match}
	 */
	getCurrentChild() {
		return this.getChildForNode(this.getCurrentChildNode());
	}

	/**
	 * Get the match instance associated with the first child node.
	 *
	 * @returns {lib/match}
	 */
	getFirstChild() {
		return this.getChildForNode(this.getFirstChildNode());
	}

	/**
	 * Returns the current child node, using our persistent child index.
	 *
	 * @returns {lib/node}
	 */
	getCurrentChildNode() {
		return this.getChildNodes()[this.getChildIndex()];
	}

	/**
	 * Returns the first child node of our associated node.
	 *
	 * @returns {lib/node}
	 */
	getFirstChildNode() {
		return this.getChildNodes()[0];
	}

	/**
	 * Returns the number of child matches (or child nodes, since they're 1:1)
	 * belonging to this match instance.
	 *
	 * @returns {int}
	 */
	getChildCount() {
		return this.getChildNodes().length;
	}

	/**
	 * Convenience method to fetch the quoted string value associated with
	 * our associated node, or null if our node doesn't contain a quoted string.
	 *
	 * @returns {string|null}
	 */
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
		this.setMaxRepeats(this.getRepeatCount() - 1);
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
		var child_nodes = this.getChildNodes();

		if (!child_nodes) {
			return false;
		}

		return child_nodes.length > 0;
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

	currentChildIsOptional() {
		return this.getCurrentChild().isOptional();
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

	isCoreRuleName(rule_name) {
		return this.getNode().isCoreRuleName(rule_name);
	}



	createMatcherForChildNode(child_node) {
		return new Matcher().setNode(child_node);
	}

	matchString(string, allow_partial = false) {
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
			throw new Error('wat');
		}

		if (!allow_partial && !this.compareStrings(result.string, string)) {
			throw new InputTooLongError(
				result.string,
				string,
				this.getNode()
			);
		}

		return result;
	}

	matchStringViaRuleName(string) {
		var rule = this.getRule();

		if (!rule) {
			throw new RuleNotFoundError(
				this.getRuleName(),
				string,
				this.getNode()
			);
		}

		var
			allow_partial = true,
			match         = null;

		try {
			match = rule.match(string, allow_partial);
		} catch (error) {
			if (error instanceof RuleNotFoundError) {
				throw error;
			}

			throw new InvalidRuleValueError(
				this.getRuleName(),
				string,
				this.getNode()
			);
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
			throw new InvalidQuotedStringError(
				this.getQuotedString(),
				string,
				this.getNode()
			);
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
			throw new Error('huh');
		}
	}

	matchStringViaNumericRange(string) {
		var char_code = string.charCodeAt(0);

		// NOTICE: Checking for a falsy char code covers the case where the
		// string is potentially empty. ("".charCodeAt(0) -> NaN)
		if (
			   !char_code
			|| char_code < this.getNumericStartValue()
			|| char_code > this.getNumericEndValue()
		) {
			throw new NumericValueOutOfRangeError(
				this.getNumericStartValue(),
				this.getNumericEndValue(),
				string,
				this.getNode()
			);
		}

		return {
			string: string[0],
			rules:  [ ]
		};
	}

	matchStringViaNumericSet(string) {
		var set = this.getNumericSet();

		if (string.length < set.length) {
			throw new NumericValueMismatchError(set, string, this.getNode());
		}

		var index = 0;

		while (index < set.length) {
			let
				numeric_value = set[index],
				char_code     = string.charCodeAt(index);

			if (char_code !== numeric_value) {
				throw new NumericValueMismatchError(set, string, this.getNode());
			}

			index++;
		}

		return {
			string: string.slice(0, set.length),
			rules:  [ ]
		};
	}

	matchStringViaRepetition(string) {
		var
			child   = this.getFirstChild(),
			matches = [ ];

		while (this.getRepeatCount() < this.getMaxRepeats()) {
			child.resetChildIndex();

			let match = null;

			try {
				match = child.matchString(string, true);
			} catch (error) {
				break;
			}

			matches.push(match);

			this.incrementRepeatCount();

			string = string.slice(match.string.length);

			if (!string) {
				break;
			}
		}

		if (this.getRepeatCount() < this.getMinRepeats()) {
			throw new NotEnoughOccurrencesError(
				this.getMinRepeats(),
				this.getRepeatCount(),
				string,
				this.getNode()
			);

		}

		return this.buildResultFromMatches(matches);
	}

	matchStringViaChildren(string) {
		if (this.hasAlternatives()) {
			return this.matchStringViaAlternativeChildren(string);
		} else {
			return this.matchStringViaSequentialChildren(string);
		}
	}

	matchStringViaAlternativeChildren(string) {
		var
			longest_child_length = 0,
			longest_child_match  = null;

		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = null;

			try {
				match = child.matchString(string, true);
			} catch (error) {
				// Drop on floor
			}

			if (match && match.string.length > longest_child_length) {
				longest_child_match  = match;
				longest_child_length = match.string.length;
			}

			this.moveToNextChild();
		}

		if (!longest_child_match) {
			throw new NoMatchingAlternativeError(string, this.getNode());
		}

		var rules;

		if (longest_child_match.rule_name) {
			rules = [longest_child_match];
		} else {
			rules = longest_child_match.rules;
		}

		return {
			string: longest_child_match.string,
			rules:  rules
		};
	}

	matchStringViaSequentialChildren(string) {
		var
			original_string = string,
			matches         = [ ];

		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = null;

			try {
				match = child.matchString(string, true);
			} catch (error) {
				if (child.isOptional()) {
					matches.push(null);

					this.moveToNextChild();
					continue;
				}

				if (this.backtrackToPriorAlternative()) {
					matches = matches.slice(0, this.getChildIndex());

					let result_string = this.buildStringFromMatches(matches);

					string = original_string.slice(result_string.length);

					continue;
				}

				throw error;
			}

			matches.push(match);

			string = string.slice(match.string.length);

			if (this.isAtLastChild()) {
				break;
			}

			this.moveToNextChild();

			if (!string) {
				if (this.currentChildIsOptional()) {
					break;
				}

				let
					current_child = this.getCurrentChild(),
					current_node  = current_child.getNode();

				if (current_child.hasRuleName()) {
					throw new MissingRuleValueError(
						current_child.getRuleName(),
						current_node
					);
				} else {
					throw new InputTooShortError(string, current_node);
				}
			}
		}

		return this.buildResultFromMatches(matches);
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
		if (this.hasAlternatives() && this.hasRemainingChildren()) {
			let child = this.getChildForIndex(this.getChildIndex() + 1);

			child.printNode();
			return this.moveToNextChild();
		}

		if (this.isRepeating() && this.canDecrementMaxRepeats()) {
			this.decrementMaxRepeats();
			this.resetRepeatCount();
			return this;
		}

		throw new Error('implement');
	}

	moveToNextChild() {
		this.incrementChildIndex();
	}


	printNode(recursive) {
		var
			node            = this.getNode().toJSON(recursive),
			serialized_node = JSON.stringify(node, null, 4);

		console.log(serialized_node);
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

	buildResultFromMatches(matches) {
		return {
			string: this.buildStringFromMatches(matches),
			rules:  this.buildRulesFromMatches(matches)
		};
	}

	buildStringFromMatches(matches) {
		var string = '';

		matches.forEach(function each(match) {
			if (match) {
				string += match.string;
			}
		});

		return string;
	}

	buildRulesFromMatches(matches) {
		var rules = [ ];

		matches.forEach(function each(match) {
			if (!match) {
				return;
			}

			if (match.rule_name) {
				if (!this.isCoreRuleName(match.rule_name)) {
					rules.push(match);
				}

				return;
			}

			var current_rules = match.rules.filter(function filter(rule) {
				return !this.isCoreRuleName(rule.rule_name);
			}, this);

			rules = rules.concat(current_rules);
		}, this);

		return rules;
	}

	compareStrings(a, b) {
		return a.toLowerCase() === b.toLowerCase();
	}

	reset() {
		this.resetChildIndex();
		this.resetRepeatCount();
	}

	resetChildIndex() {
		this.iterateOverChildren(function iterate(child) {
			child.resetChildIndex();
		});

		return this.setChildIndex(0);
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
	repeat_count: 0,
	max_repeats:  null
});


module.exports = Matcher;
