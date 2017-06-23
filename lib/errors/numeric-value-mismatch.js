
var
	InvalidNumericError = require('./invalid-numeric'),
	extend              = require('../utilities/extend');

class NumericValueMismatchError extends InvalidNumericError {

	constructor(numeric_set, value, node) {
		super(value, node);

		this.setNumericSet(numeric_set);
	}

	setNumericSet(numeric_set) {
		var
			value = this.getValue(),
			index = 0;

		while (index < Math.min(value.length, numeric_set.length)) {
			let char_code = value.charCodeAt(index);

			if (char_code !== numeric_set[index]) {
				this.setExpectedCharCode(numeric_set[index]);
				this.setActualCharCode(char_code);
				return this;
			}

			index++;
		}

		// TODO: throw or something, to ensure we handle hitting this case?
	}

	setExpectedCharCode(expected_char_code) {
		this.expected_char_code = expected_char_code;
		return this;
	}

	getExpectedCharCode() {
		return this.expected_char_code;
	}

	setActualCharCode(actual_char_code) {
		this.actual_char_code = actual_char_code;
		return this;
	}

	getActualCharCode() {
		return this.actual_char_code;
	}

	getMessage() {
		var
			expected_char_code = this.getExpectedCharCode(),
			expected_character = String.fromCharCode(expected_char_code),
			actual_char_code   = this.getActualCharCode(),
			actual_character   = String.fromCharCode(actual_char_code);

		var message = 'Numeric value did not match ';

		message += `(expected ${expected_char_code} / ${expected_character}, `;
		message += `got ${actual_char_code} / ${actual_character})`;

		return message;
	}

}

extend(NumericValueMismatchError.prototype, {
	expected_char_code: null,
	actual_char_code:   null
});


module.exports = NumericValueMismatchError;
