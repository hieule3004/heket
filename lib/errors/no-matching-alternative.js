
var
	BaseError = require('./base');


class NoMatchingAlternativeError extends BaseError {

	getMessage() {
		var value = this.getValue();

		return `No matching option for string: "${value}"`;
	}

}

module.exports = NoMatchingAlternativeError;
