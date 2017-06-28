
var
	BaseError = require('./base');


class NoMatchingAlternativeError extends BaseError {

	getMessage() {
		if (!this.hasValue()) {
			return 'No value supplied to match available options';
		}

		var value = this.getValue();

		return `No matching option for string: "${value}"`;
	}

}

module.exports = NoMatchingAlternativeError;
