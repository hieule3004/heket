
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');


class InvalidQuotedStringError extends BaseError {

	constructor(quoted_string, value, node) {
		super(value, node);

		this.setQuotedString(quoted_string);
	}

	setQuotedString(quoted_string) {
		this.quoted_string = quoted_string;
		return this;
	}

	getQuotedString() {
		return this.quoted_string;
	}

	/**
	 * @returns {string}
	 */
	getMessage() {
		var
			expected_value = this.getQuotedString(),
			actual_value   = this.getValue();

		var message = 'Invalid value for quoted string ';

		message += `(expected "${expected_value}" but got "${actual_value}")`;

		return message;
	}

}

extend(InvalidQuotedStringError.prototype, {
	quoted_string: null
});

module.exports = InvalidQuotedStringError;
