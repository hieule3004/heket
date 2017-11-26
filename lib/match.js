var
	extend = require('./utilities/extend');

// Create a constant array that we can use to pass back in cases where there
// are no match results for a particular rule. This saves us from having to
// reinstantiate a new array every time this case is encountered. But note that
// it's declared as a constant, so that there's no risk of consumers polluting
// its contents after it's returned, and before it would need to be used for
// something else.
const EMPTY_ARRAY = [ ];


/**
 * This class is used for storing, and retrieving, rule results returned from
 * the successful parsing of a string against an ABNF grammar.
 */
class Match {

	/**
	 * @returns {void}
	 */
	constructor() {
		// Bind the context of the getNext() method, so that consumers can
		// pass it directly into unparser.unparse() without having to worry
		// about binding it themselves.
		this.getNext = this.getNext.bind(this);
	}

	/**
	 * Return the first matching string value for the specified rule name.
	 *
	 * @param   {string} rule_name
	 * @returns {string|null}
	 */
	get(rule_name) {
		return this.getAll(rule_name)[0] || null;
	}

	/**
	 * Return all matching values for the specified rule name.
	 *
	 * @param   {string} rule_name
	 * @returns {array}
	 */
	getAll(rule_name) {
		var flattened_results = this.getFlattenedResults();

		if (flattened_results[rule_name]) {
			// If there were results for this rule, return a copy instead of
			// the original array. This just helps prevent people shooting
			// themselves in the foot, I guess. Alternatively I could freeze
			// the array after enumeration, but that seems like more trouble
			// than it's worth...
			return flattened_results[rule_name].slice(0);
		} else {
			return EMPTY_ARRAY;
		}
	}

	/**
	 * Return the next matching string value for the specified rule name.
	 *
	 * @param   {string} rule_name
	 * @returns {string|null}
	 */
	getNext(rule_name) {
		var
			results         = this.getAll(rule_name),
			retrieval_index = this.getRetrievalIndexForRule(rule_name);

		// Now that we've retrieved the current index,
		// increment it for next time:
		this.incrementRetrievalIndexForRule(rule_name);

		return results[retrieval_index] || null;
	}

	/**
	 * Return the general map of retrieval indices, keyed by rule name.
	 * If the map doesn't already exist, it will be created on demand.
	 *
	 * @returns {object}
	 */
	getRetrievalIndices() {
		if (!this.retrieval_indices) {
			this.retrieval_indices = { };
		}

		return this.retrieval_indices;
	}

	/**
	 * Return the current retrieval index for the specified rule name.
	 * If no index exists, it will be set to the initial value of 0.
	 *
	 * @param   {string} rule_name
	 * @returns {int}
	 */
	getRetrievalIndexForRule(rule_name) {
		var indices = this.getRetrievalIndices();

		if (!indices[rule_name]) {
			this.setRetrievalIndexForRule(0, rule_name);
			indices[rule_name] = 0;
		}

		return indices[rule_name];
	}

	/**
	 * Set the current retrieval index for the specified rule name.
	 *
	 * @param   {int} index
	 * @param   {string} rule_name
	 * @returns {self}
	 */
	setRetrievalIndexForRule(index, rule_name) {
		var indices = this.getRetrievalIndices();

		indices[rule_name] = index;

		return this;
	}

	/**
	 * Bump the retrieval index for the specified rule name.
	 *
	 * @param   {string} rule_name
	 * @returns {self}
	 */
	incrementRetrievalIndexForRule(rule_name) {
		var index = this.getRetrievalIndexForRule(rule_name);

		return this.setRetrievalIndexForRule(index + 1, rule_name);
	}

	/**
	 * Gets the list of flattened results from which we'll pull rule results.
	 * If the flattened results map doesn't exist yet, it will be created
	 * on demand.
	 *
	 * @returns {object}
	 */
	getFlattenedResults() {
		if (!this.flattened_results) {
			this.flattened_results = this.buildFlattenedResults();
		}

		return this.flattened_results;
	}

	/**
	 * Iterate over the rules specified in the raw result assigned to this
	 * match instance, and recursively enumerate the list of results by rule.
	 *
	 * This is necessary because otherwise, when someone asked us for the next
	 * rule result for the rule "foo", say, we'd have to have some weird
	 * mechanism for keeping track of where in the complex heirarchy of result
	 * nodes we were in order to know what the actual "next" result would be.
	 * Easier to just do it upfront.
	 *
	 * @returns {object}
	 */
	buildFlattenedResults() {
		var result = { };

		// An iterator function that can be recursively applied as we drill
		// our way down the tree of results:
		function iterate(array) {
			var index = 0;

			while (index < array.length) {
				let current_item = array[index];

				index++;

				let rule_name = current_item.rule_name;

				if (!rule_name) {
					continue;
				}

				// Lazily enumerate the rule result array the first time a
				// particular rule is encountered:
				if (result[rule_name] === undefined) {
					result[rule_name] = [ ];
				}

				result[rule_name].push(current_item.string);

				if (current_item.rules) {
					iterate(current_item.rules);
				}
			}
		}

		// Kick off the recursive iterator:
		iterate(this.getRawResult().rules);

		return result;
	}

	/**
	 * Set the raw result object to be used behind the scenes by this match
	 * instance.
	 *
	 * @param   {object} raw_result
	 * @returns {self}
	 */
	setRawResult(raw_result) {
		this.raw_result = raw_result;
		return this;
	}

	/**
	 * Get the raw result object used behind the scenes by this match instance.
	 *
	 * @returns {object}
	 */
	getRawResult() {
		return this.raw_result;
	}

	/**
	 * @returns {string}
	 */
	getString() {
		return this.getRawResult().string;
	}

}

/**
 * Helper method to create a new Match instance from a raw result object
 * handed back from a parser instance.
 *
 * @param   {object} raw_result
 * @returns {lib/match}
 */
Match.fromRawResult = function fromRawResult(raw_result) {
	return (new Match())
		.setRawResult(raw_result);
};

extend(Match.prototype, {
	raw_result: null
});

module.exports = Match;
