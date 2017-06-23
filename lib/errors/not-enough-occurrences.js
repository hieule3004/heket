
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');


class NotEnoughOccurrencesError extends BaseError {

	constructor(expected_count, actual_count, value, node) {
		super(value, node);

		this.setExpectedCount(expected_count);
		this.setActualCount(actual_count);
	}

	setExpectedCount(expected_count) {
		this.expected_count = expected_count;
		return this;
	}

	getExpectedCount() {
		return this.expected_count;
	}

	setActualCount(actual_count) {
		this.actual_count = actual_count;
		return this;
	}

	getActualCount() {
		return this.actual_count;
	}

	getMessage() {
		var
			expected_count = this.getExpectedCount(),
			actual_count   = this.getActualCount(),
			value          = this.getValue();

		var message = 'Not enough occurrences of repeating clause ';

		message += `(expected ${expected_count}, got ${actual_count}, `;
		message += `using value "${value}")`;

		return message;
	}

}

extend(NotEnoughOccurrencesError.prototype, {
	expected_count: null,
	actual_count:   null
});

module.exports = NotEnoughOccurrencesError;
