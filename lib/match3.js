
var
	extend = require('./utilities/extend');


var UNIQUE_ID = 0;

class Matcher {

	getId() {
		if (!this.id) {
			this.id = UNIQUE_ID++;
		}

		return this.id;
	}

	setRule(rule) {
		return this.setNode(rule.getAST());
	}

	getNode() {
		return this.node;
	}

	setNode(node) {
		this.node = node;
		return this;
	}

	getChildNodes() {
		return this.getNode().getChildNodes();
	}

	getChildNodeAtIndex(index) {
		return this.getChildNodes()[index];
	}

	getIndexOfChildNode(child_node) {
		return this.getChildNodes().indexOf(child_node);
	}

	getChildIndex() {
		return this.child_index;
	}

	setChildIndex(child_index) {
		console.log(this.getId() + ' > ' + child_index);

		this.child_index = child_index;
		return this;
	}

	incrementChildIndex() {
		return this.setChildIndex(this.getChildIndex() + 1);
	}

	getChildAtIndex(index) {
		var node = this.getChildNodeAtIndex(index);

		return this.getChildForNode(node);
	}

	getIndexOfChild(child) {
		return this.getIndexOfChildNode(child.getNode());
	}

	getChildren() {
		if (!this.children) {
			this.children = { };
		}

		return this.children;
	}

	getChildForNode(node) {
		var
			node_id  = node.getId(),
			children = this.getChildren();

		if (!children[node_id]) {
			children[node_id] = (new Matcher()).setNode(node);
		}

		return children[node_id];
	}

	getCurrentChild() {
		return this.getChildForNode(this.getCurrentNode());
	}

	getCurrentNode() {
		return this.getChildNodes()[this.getChildIndex()];
	}

	getChildCount() {
		return this.getChildNodes().length;
	}

	getQuotedString() {
		return this.getNode().getQuotedString();
	}

	getPriorChildWithRemainingAlternatives() {
		var index = this.getChildIndex();

		while (index--) {
			let child = this.getChildAtIndex(index);

			if (child.hasRemainingAlternatives()) {
				return child;
			}
		}

		return null;
	}

	getResultForChild(child) {
		return this.getResults()[child.getId()];
	}

	setResultForChild(result, child) {
		this.getResults()[child.getId()] = result;
		return this;
	}

	getResults() {
		if (!this.results) {
			this.results = { };
		}

		return this.results;
	}


	hasRuleName() {
		return this.getNode().hasRuleName();
	}

	hasQuotedString() {
		return this.getNode().hasQuotedString();
	}

	hasAlternatives() {
		return this.getNode().hasAlternatives();
	}

	hasNumericValue() {
		return this.getNode().hasNumericValue();
	}

	hasChildren() {
		return this.getChildNodes().length > 0;
	}

	hasRemainingAlternatives() {
		if (this.hasAlternatives() && !this.isAtLastChild()) {
			return true;
		}

		return this.hasPriorChildWithRemainingAlternatives();
	}

	hasPriorChildWithRemainingAlternatives() {
		return this.getPriorChildWithRemainingAlternatives() !== null;
	}

	isAtLastChild() {
		return this.getChildIndex() === this.getChildCount() - 1;
	}

	hasRemainingChildren() {
		return !this.isAtLastChild();
	}





	createMatcherForChildNode(child_node) {
		return new Matcher().setNode(child_node);
	}

	matchString(string) {
		if (this.hasRuleName()) {
			return this.matchStringViaRuleName(string);
		}

		if (this.hasQuotedString()) {
			return this.matchStringViaQuotedString(string);
		}

		if (this.hasNumericValue()) {
			return this.matchStringViaNumericValue(string);
		}

		if (this.hasChildren()) {
			return this.matchStringViaChildren(string);
		}

		throw new Error('implement');
	}

	matchStringViaQuotedString(string) {
		var quoted_string = this.getQuotedString();

		if (string.indexOf(quoted_string) !== 0) {
			return null;
		}

		return {
			value: quoted_string,
			rules: { }
		};
	}

	matchStringViaChildren(string) {
		if (this.hasAlternatives()) {
			return this.matchStringViaAlternativeChildren(string);
		} else {
			return this.matchStringViaSequentialChildren(string);
		}
	}

	matchStringViaAlternativeChildren(string) {
		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = child.matchString(string);

			if (match) {
				return match;
			}

			this.moveToNextChild();
		}

		return null;
	}

	matchStringViaSequentialChildren(string) {
		while (this.getChildIndex() < this.getChildCount()) {
			let
				child = this.getCurrentChild(),
				match = child.matchString(string);

			if (!match) {
				if (this.backtrackToPriorAlternative()) {
					string = this.buildStringFromResults();
					continue;
				} else {
					return null;
				}
			}

			string = string.slice(match.value.length);

			this.moveToNextChild();
			this.setResultForChild(match, child);
		}

		return {
			value: this.buildStringFromResults()
		};
	}

	backtrackToPriorAlternative() {
		var prior_child = this.getPriorChildWithRemainingAlternatives();

		if (!prior_child) {
			return false;
		}

		var index = this.getIndexOfChild(prior_child);

		this.setChildIndex(index);

		prior_child.moveToNextAlternative();

		return true;
	}

	moveToNextAlternative() {
		if (this.hasAlternatives() && this.hasRemainingChildren()) {
			this.moveToNextChild();
		} else {
			throw new Error('implement');
		}
	}

	moveToNextChild() {
		this.incrementChildIndex();
	}

	printNode() {
		console.log(JSON.stringify(this.getNode().toJSON(), null, 4));
	}

	buildStringFromResults() {
		var
			index  = 0,
			string = '';

		while (index < this.getChildCount()) {
			let
				child  = this.getChildAtIndex(index),
				result = this.getResultForChild(child);

			if (result) {
				string += result.value;
			}

			index++;
		}

		return string;
	}

}

extend(Matcher.prototype, {
	id:          null,
	children:    null,
	child_index: 0,
	node:        null,
	results:     null
});


module.exports = Matcher;
