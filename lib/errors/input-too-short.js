
var
	BaseError = require('./base');


class InputTooShortError extends BaseError {

	getMessage() {
		var value = this.getValue();

		return `Not enough text to match (got "${value}")`;
	}

}

module.exports = InputTooShortError;
