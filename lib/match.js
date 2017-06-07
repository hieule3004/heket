
var
	extend = require('./utilities/extend');


class Match {

	constructor() {
		this.id = Math.random().toString(16).slice(3);
	}

	setRule(rule) {
		this.rule = rule;

		var node = rule.getAST();

		this.setRootNode(node);
		this.setCurrentNode(node);
		this.recordChildIndices();
		this.recordAlternativeCounts();

		return this;
	}

	iterateOverAllNodes(callback) {
		if (!callback) {
			let type = callback === null ? 'null' : typeof callback;

			throw new Error(
				`Must supply a callback to iterateOverAllNodes, got ${type}`
			);
		}

		function iterate(node) {
			callback.call(this, node);

			if (this.nodeHasChildren(node)) {
				this.getChildrenOfNode(node).forEach(iterate, this);
			}
		}

		iterate.call(this, this.getRootNode());
	}

	recordChildIndices() {
		this.iterateOverAllNodes(this.recordChildIndexForNode);
	}

	recordAlternativeCounts() {
		this.iterateOverAllNodes(this.recordAlternativeCountsForNode);
	}

	recordChildIndexForNode(node) {
		this.setChildIndexForNode(node, -1);
	}

	recordAlternativeCountsForNode(node) {
		var count = 0;

		if (node.hasAlternatives() && this.nodeHasChildren(node)) {
			count = this.getChildCountForNode(node) - 1;
		}

		this.setRemainingAlternativeCountForNode(node, count);
		this.setTotalAlternativeCountForNode(node, count);
	}

	setString(string) {
		this.string = string;
		return this;
	}

	getString() {
		return this.string || '';
	}

	getStringLength() {
		return this.getString().length;
	}

	setCurrentStringPosition(string_position) {
		this.current_string_position = string_position;
		return this;
	}

	getCurrentStringPosition() {
		return this.current_string_position;
	}

	hasRemainingStringLength() {
		return this.getCurrentStringPosition() < this.getStringLength();
	}

	incrementCurrentStringPosition(offset) {
		this.setCurrentStringPosition(this.getCurrentStringPosition() + offset);
	}

	allowPartialMatch() {
		return this.allow_partial_match;
	}

	setAllowPartialMatch(allow_partial_match = true) {
		this.allow_partial_match = allow_partial_match;
		return this;
	}

	execute() {
		while (!this.isComplete() && this.canAdvance()) {
			console.log('checking state');

			if (this.matchesCurrentNode()) {
				this.advance();
			} else {
				this.backtrack();
			}
		}

		return this.getResult();
	}

	getResult() {
		if (!this.isComplete()) {
			return null;
		}

		if (!this.result) {
			this.result = this.buildResult();
		}

		return this.result;
	}

	buildResult() {
		var result = {
			value: this.getCompletedString(),
			rules: { }
		};

		this.iterateOverAllNodes(function iterate(node) {
			if (this.isRootNode(node)) {
				return;
			}

			if (!this.nodeHasRuleName(node)) {
				return;
			}

			if (!this.hasResultForNode(node)) {
				return;
			}

			var rule_name = this.getRuleNameForNode(node);

			result.rules[rule_name] = this.getResultForNode(node);
		});

		return result;
	}

	isComplete() {
		if (!this.allowPartialMatch() && this.hasRemainingStringLength()) {
			return false;
		}

		if (!this.nodeIsComplete(this.getRootNode())) {
			return false;
		}

		return true;
	}

	nodeIsComplete(node) {
		if (this.nodeHasChildren(node)) {
			let
				completed_count = this.getCompletedChildCountForNode(node),
				required_count  = this.getRequiredChildCountForNode(node);

			console.log(node.getId() + '       ' + completed_count + ' / ' + required_count);

			return completed_count >= required_count;
		}

		return this.hasResultForNode(node);
	}

	hasResultForNode(node) {
		return this.getResultForNode(node) !== null;
	}

	getResultForNode(node) {
		return this.getResultForNodeId(node.getId());
	}

	getResultForNodeId(node_id) {
		return this.getNodeResults()[node_id] || null;
	}

	setResultForNode(node, result) {
		return this.setResultForNodeId(node.getId(), result);
	}

	setResultForCurrentNode(result) {
		return this.setResultForNode(this.getCurrentNode(), result);
	}

	setResultForNodeId(node_id, result) {
		this.getNodeResults()[node_id] = result;
		return this;
	}

	getNodeResults() {
		if (!this.node_results) {
			this.node_results = { };
		}

		return this.node_results;
	}

	getCurrentMatchString() {
		return this.getString().slice(this.getCurrentStringPosition());
	}

	getCompletedString() {
		return this.getString().slice(0, this.getCurrentStringPosition());
	}

	matchesCurrentNode() {
		if (this.currentNodeIsRepeating()) {
			return this.currentNodeHasRemainingRepeats();
		}

		if (this.currentNodeHasChildren()) {
			return true;
		}

		var
			string = this.getCurrentMatchString(),
			match  = this.matchStringToCurrentNode(string);

		if (!match) {
			return false;
		}

		this.setResultForCurrentNode(match);
		this.incrementCurrentStringPosition(match.value.length);
		this.disableAlternativesOfCurrentNode();

		if (this.currentNodeParentIsRepeating()) {
			this.incrementCompletedRepeatCountForParentOfCurrentNode();
		}

		return true;
	}

	matchStringToCurrentNode(string) {
		return this.matchStringToNode(string, this.getCurrentNode());
	}

	matchStringToNode(string, node) {
		if (this.nodeHasRuleName(node)) {
			return this.matchStringToNodeViaRuleName(string, node);
		}

		if (node.hasQuotedString()) {
			return this.matchStringToNodeViaQuotedString(string, node);
		}

		if (node.hasNumericValue()) {
			return this.matchStringToNodeViaNumericValue(string, node);
		}

		throw new Error('implement');
	}

	matchStringToNodeViaRuleName(string, node) {
		var
			allow_partial = true,
			match         = node.getRule().match(string, allow_partial);

		if (!match) {
			return null;
		}

		return {
			value: match.value,
			rules: match.rules
		};
	}

	matchStringToNodeViaQuotedString(string, node) {
		var quoted_string = node.getQuotedString();

		if (string.indexOf(quoted_string) !== 0) {
			return null;
		}

		return {
			value: quoted_string,
			rules: { }
		};
	}

	nodeIsRepeating(node) {
		return node.isRepeating();
	}

	currentNodeIsRepeating() {
		return this.nodeIsRepeating(this.getCurrentNode());
	}

	currentNodeParentIsRepeating() {
		if (!this.currentNodeHasParent()) {
			return false;
		}

		return this.nodeIsRepeating(this.getParentOfCurrentNode());
	}

	getRuleNameForNode(node) {
		return node.getRuleName() || null;
	}

	getRuleNameForRootNode(node) {
		return this.getRuleNameForNode(this.getRootNode());
	}

	nodeHasRuleName(node) {
		return this.getRuleNameForNode(node) !== null;
	}

	rootNodeHasRuleName() {
		return this.nodeHasRuleName(this.getRootNode());
	}

	canAdvance() {
		return (
			   this.currentNodeHasNextChild()
			|| this.currentNodeHasParent()
		);
	}

	advance() {
		if (this.currentNodeHasNextChild()) {
			console.log('forward to next child');
			this.moveToNextChildOfCurrentNode();
		} else if (this.currentNodeHasParent()) {
			console.log('forward to parent');
			this.moveToParentOfCurrentNode();
		} else {
			throw new Error('wat');
		}
	}

	backtrack() {
		while (
			  !this.currentNodeHasRemainingAlternatives()
			&& this.currentNodeHasParent()
		) {
			console.log('backward to parent');
			this.moveToParentOfCurrentNode();
		}

		if (this.currentNodeHasRemainingAlternatives()) {
			this.selectPriorAlternativeForCurrentNode();
		}
	}

	currentNodeHasParent() {
		return this.nodeHasParent(this.getCurrentNode());
	}

	getParentOfCurrentNode() {
		return this.getParentOfNode(this.getCurrentNode());
	}

	nodeHasParent(node) {
		return this.getParentOfNode(node) !== null;
	}

	getChildrenOfNode(node) {
		return node.getChildNodes();
	}

	getFirstChildOfNode(node) {
		return this.getChildrenOfNode(node)[0] || null;
	}

	getChildrenOfRootNode() {
		return this.getChildrenOfNode(this.getRootNode());
	}

	currentNodeHasChildren() {
		return this.nodeHasChildren(this.getCurrentNode());
	}

	rootNodeHasChildren() {
		return this.nodeHasChildren(this.getRootNode());
	}

	nodeHasChildren(node) {
		var children = this.getChildrenOfNode(node);

		if (!children) {
			return false;
		}

		return children.length > 0;
	}

	currentNodeHasNextChild() {
		return this.nodeHasNextChild(this.getCurrentNode());
	}

	nodeHasNextChild(node) {
		if (!this.nodeHasChildren(node)) {
			return false;
		}

		if (this.nodeIsRepeating(node)) {
			return this.nodeHasRemainingRepeats(node);
		}

		if (this.getChildIndexForNode(node) + 1 >= this.getChildCountForNode(node)) {
			return false;
		}

		if (this.nodeHasAlternatives(node)) {
			return this.nodeHasRemainingAlternatives(node);
		}

		return true;
	}

	getCompletedChildCountForNode(node) {
		if (this.nodeIsRepeating(node)) {
			return this.getCompletedRepeatCountForNode(node);
		}

		return this.getCompletedChildrenForNode(node).length;
	}

	getCompletedChildrenForNode(node) {
		return this.getChildrenOfNode(node).filter(this.nodeIsComplete, this);
	}

	getRequiredChildCountForNode(node) {
		if (this.nodeHasAlternatives(node)) {
			return 1;
		}

		if (this.nodeIsRepeating(node)) {
			return this.getMinimumRepeatCountForNode(node);
		}

		var required_count = 0;

		this.getChildrenOfNode(node).forEach(function each(child_node) {
			if (child_node.isRequired()) {
				required_count++;
			}
		});

		return required_count;
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

	incrementChildIndexForNode(node) {
		var index = this.getChildIndexForNode(node);

		index++;

		this.setChildIndexForNode(node, index);

		return index;
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
		return this.getChildrenOfNode(node).length;
	}

	moveToNextChildOfCurrentNode() {
		return this.moveToNextChildOfNode(this.getCurrentNode());
	}

	moveToNextChildOfNode(node) {
		var
			index      = this.incrementChildIndexForNode(node),
			child_node = this.getChildNodeAtIndex(node, index);

		this.setCurrentNode(child_node);
	}

	getChildNodeAtIndex(parent_node, index) {
		if (this.nodeIsRepeating(parent_node)) {
			return this.getFirstChildOfNode(parent_node);
		}

		var child_nodes = this.getChildrenOfNode(parent_node);

		return child_nodes[index];
	}

	disableAlternativesOfCurrentNode() {
		return this.disableAlternativesOfNode(this.getCurrentNode());
	}

	disableAlternativesOfNode(node) {
		if (!this.nodeHasParent(node)) {
			throw new Error('implement');
		}

		var parent_node = this.getParentOfNode(node);

		if (this.nodeHasAlternatives(parent_node)) {
			return this.clearRemainingAlternativeCountForNode(parent_node);
		} else {
			// ???
		}
	}

	clearRemainingAlternativeCountForNode(node) {
		return this.setRemainingAlternativeCountForNode(node, 0);
	}

	nodeHasAlternatives(node) {
		return this.getTotalAlternativeCountForNode(node) > 0;
	}

	getTotalAlternativeCountForNode(node) {
		return this.getTotalAlternativeCountForNodeId(node.getId());
	}

	getTotalAlternativeCountForNodeId(node_id) {
		var count = this.getTotalAlternativeCounts()[node_id];

		if (count === undefined) {
			throw new Error(
				`No alternative count set for node ${node_id}`
			);
		}

		return count;
	}

	setTotalAlternativeCountForNode(node, count) {
		return this.setTotalAlternativeCountForNodeId(node.getId(), count);
	}

	setTotalAlternativeCountForNodeId(node_id, count) {
		this.getTotalAlternativeCounts()[node_id] = count;

		return this;
	}

	currentNodeHasRemainingAlternatives() {
		return this.nodeHasRemainingAlternatives(this.getCurrentNode());
	}

	nodeHasRemainingAlternatives(node) {
		return this.getRemainingAlternativeCountForNode(node) > 0;
	}

	getRemainingAlternativeCountForNode(node) {
		return this.getRemainingAlternativeCountForNodeId(node.getId());
	}

	getRemainingAlternativeCountForNodeId(node_id) {
		var count = this.getRemainingAlternativeCounts()[node_id];

		if (count === undefined) {
			throw new Error(
				`No alternative count set for node ${node_id}`
			);
		}

		return count;
	}

	setRemainingAlternativeCountForNode(node, count) {
		return this.setRemainingAlternativeCountForNodeId(node.getId(), count);
	}

	setRemainingAlternativeCountForNodeId(node_id, count) {
		this.getRemainingAlternativeCounts()[node_id] = count;

		return this;
	}

	getRemainingAlternativeCounts() {
		if (!this.remaining_alternative_counts) {
			this.remaining_alternative_counts = { };
		}

		return this.remaining_alternative_counts;
	}

	getTotalAlternativeCounts() {
		if (!this.total_alternative_counts) {
			this.total_alternative_counts = { };
		}

		return this.total_alternative_counts;
	}

	nodeHasRemainingRepeats(node) {
		var repeat_count = this.getRemainingRepeatCountForNode(node);

		return repeat_count > 0;
	}

	currentNodeHasRemainingRepeats() {
		return this.nodeHasRemainingRepeats(this.getCurrentNode());
	}

	getRemainingRepeatCountForNode(node) {
		var count = this.getRemainingRepeatCountForNodeId(node.getId());

		if (count === undefined) {
			count = this.getMaximumRepeatCountForNode(node);
		}

		return count;
	}

	getMinimumRepeatCountForNode(node) {
		return node.getMinRepeats();
	}

	getMaximumRepeatCountForNode(node) {
		return node.getMaxRepeats();
	}

	getRemainingRepeatCountForNodeId(node_id) {
		return this.getRemainingRepeatCounts()[node_id];
	}

	getRemainingRepeatCounts() {
		if (!this.remaining_repeat_counts) {
			this.remaining_repeat_counts = { };
		}

		return this.remaining_repeat_counts;
	}

	incrementCompletedRepeatCountForNode(node) {
		var completed_count = this.getCompletedRepeatCountForNode(node);

		return this.setCompletedRepeatCountForNode(node, completed_count + 1);
	}

	incrementCompletedRepeatCountForParentOfCurrentNode() {
		var node = this.getParentOfCurrentNode();

		return this.incrementCompletedRepeatCountForNode(node);
	}

	setCompletedRepeatCountForNode(node, repeat_count) {
		return this.setCompletedRepeatCountForNodeId(node.getId(), repeat_count);
	}

	setCompletedRepeatCountForNodeId(node_id, repeat_count) {
		var counts = this.getCompletedRepeatCounts();

		counts[node_id] = repeat_count;

		return this;
	}

	getCompletedRepeatCountForNode(node) {
		return this.getCompletedRepeatCountForNodeId(node.getId());
	}

	getCompletedRepeatCountForNodeId(node_id) {
		return this.getCompletedRepeatCounts()[node_id] || 0;
	}

	getCompletedRepeatCounts() {
		if (!this.completed_repeat_counts) {
			this.completed_repeat_counts = { };
		}

		return this.completed_repeat_counts;
	}

	isAtRootNode() {
		return this.getCurrentNode() === this.getRootNode();
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
		if (!current_node) {
			let type = current_node === null ? 'null' : typeof current_node;

			throw new Error(
				`Tried to set invalid value for current_node (got ${type})`
			);
		}

		console.log(' ');
		console.log(' ');
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log('> ' + current_node.getId());
		console.log('"' + this.getCurrentMatchString() + '"');
		console.log(JSON.stringify(current_node.toJSON(), null, 4));
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log(' ');
		console.log(' ');

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

	isRootNode(node) {
		return node === this.getRootNode();
	}

}

extend(Match.prototype, {

	result:                       null,
	current_node:                 null,
	root_node:                    null,

	remaining_alternative_counts: null,
	total_alternative_counts:     null,
	node_child_indices:           null,

	current_string_position:      0,

	node_results:                 null,

	allow_partial_match:          true

});

module.exports = Match;
