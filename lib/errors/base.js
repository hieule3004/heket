
var
	extend = require('../utilities/extend');


class BaseError extends Error {

	constructor(value, node = null) {
		super();

		this.setValue(value);
		this.setNode(node);
	}

	/**
	 * Hard-wired method for returning a null rule name by default.
	 * This exists in case any consumers try to call this method on a subclass
	 * of BaseError that doesn't support rule names being associated with it.
	 * Override this on child classes in order to return actual rule names.
	 *
	 * @returns {null}
	 */
	getRuleName() {
		return null;
	}

	/**
	 * Hard-wired method for returning whether or not this error has a
	 * corresponding method name. Override this in child classes in order
	 * to return a possibly-true value; this only exists here in case consumers
	 * try to call this method on a subclass that would never have a rule set.
	 *
	 * @returns {boolean}
	 */
	hasRuleName() {
		return false;
	}

	/**
	 * @returns {string|null}
	 */
	getValue() {
		return this.value;
	}

	/**
	 * @param   {string|null} value
	 * @returns {self}
	 */
	setValue(value) {
		this.value = value;
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	hasValue() {
		return this.getValue() !== null;
	}

	/**
	 * @returns {lib/node}
	 */
	getNode() {
		return this.node;
	}

	/**
	 * @param   {lib/node|null} node
	 * @returns {self}
	 */
	setNode(node) {
		this.node = node;
		return this;
	}

	/**
	 * @returns {boolean}
	 */
	hasNode() {
		return this.getNode() !== null;
	}

	/**
	 * This accessor method is necessary, because error subclasses have to
	 * expose a "message" property in order for customized messages to display
	 * correctly in the console, etc. The easiest way to allow for message
	 * customization is to plug into the accessor and call out to an overridable
	 * method (getMessage(), see below).
	 *
	 * @returns {string}
	 */
	get message() {
		return this.getMessage() + this.getTrace();
	}

	/**
	 * @returns {string}
	 */
	getTrace() {
		if (!this.hasNode()) {
			return '';
		}

		var
			node        = this.getNode(),
			parent_node = node;

		while (parent_node.hasParent()) {
			parent_node = parent_node.getParent();
		}

		if (!parent_node.hasParentRuleName()) {
			return '';
		}

		var
			parent_rule_name = parent_node.getParentRuleName(),
			string_position  = node.getPosition() + parent_rule_name.length + 3,
			result           = '\n' + parent_rule_name + ' = ';

		result += parent_node.getString() + '\n';
		result += Array(string_position).fill('-').join('');
		result += '^';

		return result;
	}

	/**
	 * Returns the value that should be displayed in the console, etc, when
	 * instances of this error are thrown. Override this on child classes.
	 *
	 * @throws {Error}
	 * @returns {void}
	 */
	getMessage() {
		throw new Error('Must override getMessage() in BaseError subclass');
	}

}

extend(BaseError.prototype, {
	value: null
});

module.exports = BaseError;
