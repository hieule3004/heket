
var
	extend = require('./utilities/extend');

const EMPTY_ARRAY = [ ];

class Match {

	get(rule_name) {
		return this.getAll(rule_name)[0] || null;
	}

	getAll(rule_name) {
		var flattened_results = this.getFlattenedResults();

		if (flattened_results[rule_name]) {
			return flattened_results[rule_name].slice(0);
		} else {
			return EMPTY_ARRAY;
		}
	}

	getFlattenedResults() {
		if (!this.flattened_results) {
			this.flattened_results = this.buildFlattenedResults();
		}

		return this.flattened_results;
	}

	buildFlattenedResults() {
		var result = { };

		function iterate(array) {
			var index = 0;

			while (index < array.length) {
				let current_item = array[index];

				index++;

				let rule_name = current_item.rule_name;

				if (!rule_name) {
					continue;
				}

				if (result[rule_name] === undefined) {
					result[rule_name] = [ ];
				}

				result[rule_name].push(current_item.string);

				if (current_item.rules) {
					iterate(current_item.rules);
				}
			}
		}

		iterate(this.getRawResult().rules);

		return result;
	}

	setRawResult(raw_result) {
		this.raw_result = raw_result;
		return this;
	}

	getRawResult() {
		return this.raw_result;
	}

}

Match.fromRawResult = function fromRawResult(raw_result) {
	return (new Match())
		.setRawResult(raw_result);
};

extend(Match.prototype, {
	raw_result: null
});

module.exports = Match;
