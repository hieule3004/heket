
var
	BaseError = require('./base'),
	extend    = require('../utilities/extend');


class CircularRuleReferenceError extends BaseError {

	getMessage() {
		return 'Circular rule reference detected';
	}

}

extend(CircularRuleReferenceError.prototype, {
});


module.exports = CircularRuleReferenceError;
