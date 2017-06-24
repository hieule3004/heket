
var
	extend = require('./utilities/extend');

var
	MissingRuleValueError = require('./errors/missing-rule-value'),
	InvalidRuleValueError = require('./errors/invalid-rule-value'),
	RuleNotFoundError     = require('./errors/rule-not-found'),
	Match                 = require('./match');


/**
 * The Unparser class is responsible for serializing a string based on its
 * associated ABNF AST. It will iterate recursively down the AST structure
 * and request values for any rule references that it encounters at each
 * node in the tree. Unparser instances are created recursively in a 1:1
 * relationship with each node.
 */
class Unparser {

	/**
	 * Convenience method to pluck the node associated with the given rule
	 * and store it on the unparser.
	 *
	 * @param   {lib/rule} rule
	 * @returns {self}
	 */
	setRule(rule) {
		this.setNode(rule.getNode());
		return this;
	}

	/**
	 * Return the rule for the node associated with this unparser instance.
	 * Note that not every node has a rule. Don't let the above method
	 * deceive you into thinking that every unparser instance will have one.
	 *
	 * @returns {lib/rule}
	 */
	getRule() {
		return this.getNode().getRule();
	}

	/**
	 * Set the node for this unparser instance. Each unparser instance will
	 * have exactly one association with a node in the relevant ABNF AST.
	 *
	 * @param   {lib/node} node
	 * @returns {self}
	 */
	setNode(node) {
		this.node = node;
		return this;
	}

	/**
	 * Return the node associated with this unparser instance.
	 *
	 * @returns {lib/node}
	 */
	getNode() {
		return this.node;
	}

	/**
	 * Determine whether or not our associated node has any children.
	 *
	 * @returns {boolean}
	 */
	hasChildren() {
		return this.getNode().hasChildNodes();
	}

	/**
	 * Determine whether or not our associated node is repeating.
	 *
	 * @returns {boolean}
	 */
	isRepeating() {
		return this.getNode().isRepeating();
	}

	/**
	 * Determine whether or not our associated node is optional.
	 *
	 * @returns {boolean}
	 */
	isOptional() {
		return this.getNode().isOptional();
	}

	/**
	 * Determine whether or not our associated node has any alternatives.
	 * @returns {boolean}
	 */
	hasAlternatives() {
		return this.getNode().hasAlternatives();
	}

	/**
	 * Return an array of Unparsers for the child nodes of our current node.
	 *
	 * If the array of children doesn't exist yet, it will be instantiated
	 * on demand.
	 *
	 * @returns {lib/unparser[]}
	 */
	getChildren() {
		if (!this.children) {
			let
				node        = this.getNode(),
				child_nodes = node.getChildNodes();

			this.children = child_nodes.map(function map(node) {
				return (new Unparser())
					.setNode(node);
			});
		}

		return this.children;
	}

	/**
	 * Return the first child unparser.
	 *
	 * @returns {lib/unparser}
	 */
	getFirstChild() {
		return this.getChildren()[0];
	}

	/**
	 * Returns the minimum required number of repeats for the node associated
	 * with this unparser instance.
	 *
	 * @returns {int}
	 */
	getMinRepeats() {
		return this.getNode().getMinRepeats();
	}

	/**
	 * Returns the maximum allowed number of repeats for the node associated
	 * with this unparser instance.
	 *
	 * @returns {int}
	 */
	getMaxRepeats() {
		return this.getNode().getMaxRepeats();
	}

	/**
	 * Determine whether or not our associated node has a quoted string value.
	 *
	 * @returns {boolean}
	 */
	hasQuotedString() {
		return this.getNode().hasQuotedString();
	}

	/**
	 * Get the quoted string value for the node associated with this instance.
	 *
	 * @returns {string}
	 */
	getQuotedString() {
		return this.getNode().getQuotedString();
	}

	/**
	 * Determine whether or not our associated node has a rule name.
	 *
	 * @returns {boolean}
	 */
	hasRuleName() {
		return this.getNode().hasRuleName();
	}

	/**
	 * Get the rule name for our associated node, or null if no rule is set.
	 *
	 * @returns {string|null}
	 */
	getRuleName() {
		return this.getNode().getRuleName();
	}

	/**
	 * Okay, this is a little tricky. This method is responsible for
	 * standardizing the single argument supplied to unparser.unparse()
	 * into a function accepting a function name string and numeric index
	 * as its arguments.
	 *
	 * Because unparser.unparse() can also accept an object to use for rule
	 * value lookups, this method allows us to have a consistent interface
	 * for plucking values from either type of argument.
	 *
	 * @param   {function|object} callback_or_map
	 * @throws {Error} when an invalid value is supplied
	 * @returns {function}
	 */
	createCallback(callback_or_map) {
		if (!callback_or_map) {
			callback_or_map = { };
		}

		var map = null;

		// If we're not dealing with a function, we need to create one ourselves
		// in order to wrap the object that was supplied to us.
		if (typeof callback_or_map !== 'function') {
			map = callback_or_map;

			// This basically mimics the behavior of function arguments
			// to unparser.unparse() in order to pluck values off of the
			// supplied object.
			callback_or_map = function callback(rule_name, index) {
				var rule_results = map[rule_name];

				// If the lookup value was not specifed, just bail out;
				// Note that we can't just do a !rule_results falsy check
				// because of instances where the consumer may have specified
				// a `0` numeric value, or `false`, and expect that to be
				// interpolated into the serialized unparser result as a string.
				if (rule_results === null || rule_results === undefined) {
					return rule_results;
				}

				// Ideal case; the value the consumer supplied for this key
				// is an array of values, which we can pluck off given the
				// current index. Let's get that case out of the way first:
				if (Array.isArray(rule_results)) {
					return rule_results[index] || null;
				}

				// Now, if it's not an array that was supplied, it means that
				// the consumer used the shorthand syntax for specifying a
				// single value for this rule lookup, to avoid bothering with
				// wrapping it in an array.

				// In this case, we only want to return the value if it's the
				// first time we're trying to retrieve it:
				if (index === 0) {
					return rule_results;
				} else {
					return null;
				}
			};
		}

		// If the value we're examining has already had a "is_wrapped" boolean
		// property set on it, then we should bail out. This prevents any
		// cases of unnecessarily re-wrapping functions over and over as they're
		// passed down the AST to descendant nodes.
		if (callback_or_map.is_wrapped) {
			return callback_or_map;
		}

		// Keep a tally of the number of times we've requested a value for a
		// particular rule -- this is what enables us to provide to the
		// consumer the second "index" argument indicating the number of
		// times that rule has been encountered.
		var rule_counts = { };

		function getValueForRule(rule_name) {
			// Underscores are not allowed in ABNF rule names, but hyphens are.
			// Standardize the rule name to use underscores instead of hyphens
			// for lookup purposes.
			rule_name = rule_name.replace(/-/g, '_');

			// Lazily enumerate a counter for the current rule if it's the first
			// time it's been encountered.
			if (!rule_counts[rule_name]) {
				rule_counts[rule_name] = 0;
			}

			// Grab a reference to the current count before incrementing:
			var count = rule_counts[rule_name];

			rule_counts[rule_name]++;

			// Finally, invoke the user-supplied callback with the rule name
			// and the current count.
			var result = callback_or_map(rule_name, count);

			// If a value was returned, coerce the result to a string.
			// Note that we can't just use a falsy check, because we want to
			// allow for certain falsy primitives (ie, `0` and `false`) to
			// be returned and coerced, as well:
			if (
				   result !== null
				&& result !== undefined
				&& typeof result !== 'string'
			) {
				result = result.toString();
			}

			return result;
		}

		// Set the boolean value to prevent redundant re-wrappings.
		getValueForRule.is_wrapped = true;

		return getValueForRule;
	}

	/**
	 * Where the magic happens. Depending on the characteristics of the node
	 * associated with this unparser instance, defer to one of several different
	 * sub-methods in order to create a serialized string.
	 *
	 * @param   {function|object} callback_or_map
	 *
	 * @throws  {InvalidRuleValueError} when an invalid value is returned by the
	 *          consumer for a particular rule
	 *
	 * @throws  {MissingRuleValueError} when nothing is returned by the consumer
	 *          for a required rule
	 *
	 * @returns {string}
	 */
	unparse(callback_or_map) {
		// If the consumer specified a Match instance, we should switch to
		// supplying the `getNext` accessor method on the match instance,
		// instead. Note that we don't need to call `.bind()`, here; the
		// context of `getNext` is already bound for us within the Match class.
		if (callback_or_map instanceof Match) {
			callback_or_map = callback_or_map.getNext;
		}

		var callback = this.createCallback(callback_or_map);

		if (this.isRepeating()) {
			return this.unparseViaRepetition(callback);
		}

		if (this.hasChildren()) {
			return this.unparseViaChildren(callback);
		}

		if (this.hasQuotedString()) {
			return this.unparseViaQuotedString(callback);
		}

		if (this.hasRuleName()) {
			return this.unparseViaRuleName(callback);
		}

		throw new Error('wat');
	}

	unparseViaRepetition(callback) {
		var
			first_child        = this.getFirstChild(),
			index              = 0,
			max_repeats        = this.getMaxRepeats(),
			combined_result    = '',
			child_error        = null,
			was_rule_miss      = false,
			rule_result_misses = 0;

		function wrappedCallback(rule_name, index) {
			var result = callback(rule_name, index);

			if (result === null || result === undefined) {
				was_rule_miss = true;
			}

			return result;
		}

		while (index < max_repeats) {
			let child_result = null;

			try {
				child_result = first_child.unparse(wrappedCallback);
			} catch (error) {
				// We want to re-throw errors resulting from the user supplying
				// invalid rule values (but not from missing rule values):
				if (error instanceof InvalidRuleValueError) {
					throw error;
				}

				// Store a record of the error so that we can re-throw it
				// later if needed. This allows the consumer to determine
				// the name of the rule for which they need to supply values.
				child_error = error;

				break;
			}

			if (was_rule_miss) {
				rule_result_misses++;
			}

			if (rule_result_misses > this.getMinRepeats()) {
				break;
			}

			combined_result += child_result;

			index++;
		}

		if (index < this.getMinRepeats()) {
			if (!child_error) {
				// To be honest, I can't think of a scenario where this would
				// ever happen -- we should always have a child error if we
				// reach this point.
				//
				// But if for some reason I'm wrong, and it's possible to get
				// here and still have child_error unset, then I'm at least
				// going to throw an instance of MissingRuleValueError in case
				// any consumer is relying on receiving an error of that type.
				throw new MissingRuleValueError();
			}

			throw child_error;
		}

		return combined_result;
	}

	unparseViaQuotedString(callback) {
		return this.getQuotedString();
	}

	unparseViaRuleName(callback) {
		var
			rule      = this.getRule(),
			rule_name = this.getRuleName();

		var rule_value;

		try {
			rule_value = callback(rule_name);
		} catch (error) {
			// It's possible that the error thrown during the retrieval of
			// the current rule value is itself an instance of the error class
			// used to designate that a rule value was not supplied. This can
			// happen in cases where the consumer is calling out to separate
			// unparser instances to produce the values needed to seed the
			// current unparsing action. If such errors occur, we need to flag
			// them as not suppressable, because otherwise they will be
			// swallowed in certain cases later down this parsing cycle.
			if (error instanceof MissingRuleValueError) {
				error.setShouldBeSuppressed(false);
			}

			throw error;
		}

		if (!rule_value) {
			if (rule.hasFixedValue() && rule_value === undefined) {
				return rule.getFixedValue();
			}

			throw new MissingRuleValueError(rule_name, rule.getNode());
		}

		try {
			rule.match(rule_value);
		} catch (error) {
			if (error instanceof RuleNotFoundError) {
				throw error;
			}

			throw new InvalidRuleValueError(
				rule_name,
				rule_value,
				rule.getNode()
			);
		}

		return rule_value;
	}

	unparseViaChildren(callback) {
		if (this.hasAlternatives()) {
			return this.unparseViaAlternativeChildren(callback);
		} else {
			return this.unparseViaSequentialChildren(callback);
		}
	}

	unparseViaAlternativeChildren(callback) {
		var
			index       = 0,
			children    = this.getChildren(),
			child_error = null;

		while (index < children.length) {
			let child = children[index];

			try {
				return child.unparse(callback);
			} catch (error) {
				child_error = error;
			}

			index++;
		}

		if (!child_error) {
			throw new Error('implement');
		}

		throw child_error;
	}

	unparseViaSequentialChildren(callback) {
		var
			index           = 0,
			children        = this.getChildren(),
			combined_result = '';

		while (index < children.length) {
			let
				child        = children[index],
				child_result = null;

			try {
				child_result = child.unparse(callback);
			} catch (error) {
				if (!child.isOptional()) {
					throw error;
				}

				// Even if the child is optional, we only want to swallow
				// the error if it's due to the value being missing.
				// If the value exists, but is invalid, that should bubble up.
				if (!(error instanceof MissingRuleValueError)) {
					throw error;
				}

				// Additionally, we need to check whether the error has been
				// explicitly marked as ineligible for suppression. This occurs
				// when the error originates in the unparsing of a different
				// rule, within that rule's callback for fetching a specific
				// value for a nested rule name. If such an error occurs, we
				// want it to bubble up.
				if (!error.shouldBeSuppressed()) {
					throw error;
				}
			}

			if (child_result) {
				combined_result += child_result;
			}

			index++;
		}

		return combined_result;
	}

}

extend(Unparser.prototype, {
	node:     null,
	children: null
});

module.exports = Unparser;
