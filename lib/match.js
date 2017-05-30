
var
	extend = require('./utilities/extend');


class Match {

	setRule(rule) {
		this.rule = rule;

		var node = rule.getAst();

		this.setRootNode(node);
		this.setCurrentNode(node);
		this.recordChildIndices();

		return this;
	}

	recordChildIndices() {
		this.recordChildIndicesForNodeRecursive(this.getRootNode());
	}

	recordChildIndicesForNodeRecursive(node) {
		this.setChildIndexForNode(node, 0);

		this.getChildrenForNode(node).forEach(
			this.recordChildIndicesForNodeRecursive,
			this
		);
	}

	setString(string) {
		this.string = string;
		return this;
	}

	execute() {
		while (!this.hasResult() && this.hasUntraversedNodes()) {
			if (this.matchesCurrentNode()) {
				this.advance();
			} else {
				this.backtrack();
			}
		}

		return this.getResult();
	}

	getResult() {
		return this.result;
	}

	hasResult() {
		return this.getResult() !== null;
	}

	matchesCurrentNode() {
		return true;
	}

	hasUntraversedNodes() {
		return true;
	}

	advance() {
		if (this.currentNodeHasNextChild()) {
			this.moveToNextChildOfCurrentNode();
		} else if (this.currentNodeHasNextSibling()) {
			this.moveToNextSiblingOfCurrentNode();
		} else {
			this.moveToParentOfCurrentNode();
		}
	}

	backtrack() {
		while (!this.currentNodeHasAlternatives() && !this.isAtRootNode()) {
			this.moveToParentOfCurrentNode();
		}
	}

	getChildrenForNode(node) {
		return node.getChildren();
	}

	currentNodeHasNextChild() {
		return this.nodeHasNextChild(this.getCurrentNode());
	}

	nodeHasNextChild(node) {
		return this.getChildIndexForNode(node) < this.getChildCountForNode(node);
	}

	getChildIndexForNode(node) {
		return this.getChildIndexForNodeId(node.getId());
	}

	getChildIndexForNodeId(node_id) {
		var child_index = this.getNodeChildIndices()[node_id];

		if (child_index === undefined) {
			throw new Error(
				`No child index set for node ${node_id}`
			);
		}

		return child_index;
	}

	setChildIndexForNode(node, child_index) {
		return this.setChildIndexForNodeId(node.getId(), child_index);
	}

	setChildIndexForNodeId(node_id, child_index) {
		this.getNodeChildIndices()[node_id] = child_index;
		return this;
	}

	getNodeChildIndices() {
		if (!this.node_child_indices) {
			this.node_child_indices = { };
		}

		return this.node_child_indices;
	}

	getChildCountForNode(node) {
		return node.getChildren().length;
	}

	currentNodeHasAlternatives() {
		return this.nodeHasAlternatives(this.getCurrentNode());
	}

	nodeHasAlternatives(node) {
		return this.getAlternativeCountForNode(node) > 0;
	}

	getAlternativeCountForNode(node) {
		return this.getAlternativeCountForNodeId(node.getId());
	}

	getAlternativeCountForNodeId(node_id) {
		var count = this.getNodeAlternativeCounts()[node_id];

		if (count === undefined) {
			throw new Error(
				`No alternative count set for node ${node_id}`
			);
		}

		return count;
	}

	getNodeAlternativeCounts() {
		if (!this.node_alternative_counts) {
			this.node_alternative_counts = { };
		}

		return this.node_alternative_counts;
	}

	isAtRootNode() {
		return this.getCurrentNode() === this.getRootNode();
	}

	moveToNextSiblingOfCurrentNode() {
		return this.moveToNextSiblingOfNode(this.getCurrentNode());
	}

	moveToNextSiblingOfNode(node) {
		return this.setCurrentNode(this.getNextSiblingForNode(node));
	}

	getNextSiblingForNode(node) {
		throw new Error('implement');
	}

	currentNodeHasNextSibling() {
		return this.nodeHasNextSibling(this.getCurrentNode());
	}

	nodeHasNextSibling(node) {
		return this.getNextSiblingForNode(node) !== null;
	}

	moveToParentOfCurrentNode() {
		return this.moveToParentOfNode(this.getCurrentNode());
	}

	moveToParentOfNode(node) {
		return this.setCurrentNode(this.getParentOfNode(node));
	}

	getParentOfNode(node) {
		return node.getParent();
	}

	getCurrentNode() {
		return this.current_node;
	}

	setCurrentNode(current_node) {
		this.current_node = current_node;

		return this;
	}

	getRootNode() {
		return this.root_node;
	}

	setRootNode(root_node) {
		this.root_node = root_node;
		return this;
	}

}

extend(Match.prototype, {

	result:                  null,
	current_node:            null,
	root_node:               null,

	node_alternative_counts: null,
	node_child_indices:      null

});

module.exports = Match;
