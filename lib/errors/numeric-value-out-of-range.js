
var
	InvalidNumericError = require('./invalid-numeric'),
	extend              = require('../utilities/extend');

class NumericValueOutOfRangeError extends InvalidNumericError {

	constructor(start_value, end_value, value, node) {
		super(value, node);

		this.setStartValue(start_value);
		this.setEndValue(end_value);
	}

	setStartValue(start_value) {
		this.start_value = start_value;
		return this;
	}

	getStartValue() {
		return this.start_value;
	}

	setEndValue(end_value) {
		this.end_value = end_value;
		return this;
	}

	getEndValue() {
		return this.end_value;
	}

	getMessage() {
		var
			start_value = this.getStartValue(),
			end_value   = this.getEndValue(),
			range       = start_value + ' - ' + end_value,
			value       = this.getValue(),
			char_code   = value.charCodeAt(0);

		var message = 'Numeric value out of range ';

		message += `(expected value within [${range}], `;
		message += `got ${char_code} / ${value})`;

		return message;
	}

}

extend(NumericValueOutOfRangeError.prototype, {
	start_value: null,
	end_value:   null
});

module.exports = NumericValueOutOfRangeError;
