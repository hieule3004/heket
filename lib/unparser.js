
var
	extend = require('./utilities/extend');

var
	MissingRuleValueError = require('./errors/missing-rule-value'),
	InvalidRuleValueError = require('./errors/invalid-rule-value');


class Unparser {

	setRule(rule) {
		this.setNode(rule.getNode());
		return this;
	}

	getRule() {
		return this.getNode().getRule();
	}

	setNode(node) {
		this.node = node;
		return this;
	}

	getNode() {
		return this.node;
	}

	hasChildren() {
		return this.getNode().hasChildNodes();
	}

	isRepeating() {
		return this.getNode().isRepeating();
	}

	isOptional() {
		return this.getNode().isOptional();
	}

	hasAlternatives() {
		return this.getNode().hasAlternatives();
	}

	getChildren() {
		if (!this.children) {
			let
				node        = this.getNode(),
				child_nodes = node.getChildNodes();

			this.children = child_nodes.map(function map(node) {
				return (new Unparser())
					.setNode(node);
			});
		}

		return this.children;
	}

	getFirstChild() {
		return this.getChildren()[0];
	}

	getMinRepeats() {
		return this.getNode().getMinRepeats();
	}

	getMaxRepeats() {
		return this.getNode().getMaxRepeats();
	}

	hasQuotedString() {
		return this.getNode().hasQuotedString();
	}

	getQuotedString() {
		return this.getNode().getQuotedString();
	}

	hasRuleName() {
		return this.getNode().hasRuleName();
	}

	getRuleName() {
		return this.getNode().getRuleName();
	}

	unparse(callback) {
		if (this.isRepeating()) {
			return this.unparseViaRepetition(callback);
		}

		if (this.hasChildren()) {
			return this.unparseViaChildren(callback);
		}

		if (this.hasQuotedString()) {
			return this.unparseViaQuotedString(callback);
		}

		if (this.hasRuleName()) {
			return this.unparseViaRuleName(callback);
		}

		throw new Error('wat');
	}

	unparseViaRepetition(callback) {
		var
			first_child     = this.getFirstChild(),
			index           = 0,
			max_repeats     = this.getMaxRepeats(),
			combined_result = '',
			child_error     = null;

		while (index < max_repeats) {

			try {
				combined_result += first_child.unparse(callback);
			} catch (error) {
				child_error = error;
				break;
			}

			index++;
		}

		if (index < this.getMinRepeats()) {
			if (child_error) {
				throw child_error;
			}

			throw new Error('implement');
		}

		return combined_result;
	}

	unparseViaQuotedString(callback) {
		return this.getQuotedString();
	}

	unparseViaRuleName(callback) {
		var rule_value = callback(this.getRuleName());

		if (!rule_value) {
			throw (new MissingRuleValueError())
				.setRuleName(this.getRuleName());
		}

		var match = this.getRule().match(rule_value);

		if (!match) {
			throw (new InvalidRuleValueError())
				.setRuleName(this.getRuleName())
				.setRuleValue(rule_value);
		}

		return rule_value;
	}

	unparseViaChildren(callback) {
		if (this.hasAlternatives()) {
			return this.unparseViaAlternativeChildren(callback);
		} else {
			return this.unparseViaSequentialChildren(callback);
		}
	}

	unparseViaAlternativeChildren(callback) {
		var
			index       = 0,
			children    = this.getChildren(),
			child_error = null;

		while (index < children.length) {
			let child = children[index];

			try {
				return child.unparse(callback);
			} catch (error) {
				child_error = error;
			}

			index++;
		}

		if (!child_error) {
			throw new Error('implement');
		}

		throw child_error;
	}

	unparseViaSequentialChildren(callback) {
		var
			index           = 0,
			children        = this.getChildren(),
			combined_result = '';

		while (index < children.length) {
			let
				child        = children[index],
				child_result = null;

			try {
				child_result = child.unparse(callback);
			} catch (error) {
				if (!child.isOptional()) {
					throw error;
				}

				if (!(error instanceof MissingRuleValueError)) {
					throw error;
				}
			}

			if (child_result) {
				combined_result += child_result;
			}

			index++;
		}

		return combined_result;
	}

}

extend(Unparser.prototype, {
	node: null
});

module.exports = Unparser;
