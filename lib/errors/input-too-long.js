
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');


class InputTooLongError extends BaseError {

	constructor(expected_value, value, node) {
		super(value, node);

		this.setExpectedValue(expected_value);
	}

	setExpectedValue(expected_value) {
		this.expected_value = expected_value;
		return this;
	}

	getExpectedValue() {
		return this.expected_value;
	}

	getMessage() {
		var
			expected = this.getExpectedValue(),
			actual   = this.getValue();

		return `Too much text to match (expected "${expected}", got "${actual}")`;
	}

}

extend(InputTooLongError.prototype, {
	expected_value: null
});


module.exports = InputTooLongError;
