
var
	extend = require('./utilities/extend');


class NodeMetadata {

	getCompletedRepeatCount() {
		return this.completed_repeat_count;
	}

	getRemainingAlternativesCount() {
		return this.remaining_alternatives_count;
	}

	setRemainingAlternativesCount(count) {
		this.remaining_alternatives_count = count;
		return this;
	}

	getTotalAlternativesCount() {
		return this.total_alternatives_count;
	}

	setTotalAlternativesCount(count) {
		this.total_alternatives_count = count;
		return this;
	}

	getChildIndex() {
		return this.child_index;
	}

	setChildIndex(child_index) {
		this.child_index = child_index;
		return this;
	}

	setResult(result) {
		this.result = result;
		return this;
	}

	getResult() {
		return this.result;
	}

}

extend(NodeMetadata.prototype, {
	completed_repeat_count:       0,
	remaining_alternatives_count: 0,
	total_alternatives_count:     0,
	child_index:                  -1,
	result:                       null
});



class Match {

	/**
	 * THE HEART OF DARKNESS
	 */

	execute() {
		while (!this.isComplete() && this.canAdvance()) {
			if (this.matchesCurrentNode()) {
				this.advance();
			} else {
				this.backtrack();
			}
		}

		return this.getResult();
	}

	advance() {
		if (this.currentNodeHasNextChild()) {
			this.moveToNextChildOfCurrentNode();
		} else if (this.currentNodeHasParent()) {
			this.moveToParentOfCurrentNode();
		} else {
			throw new Error('wat');
		}
	}

	backtrack() {
		var prior_node = this.getLastPriorNodeWithRemainingAlternatives();

		if (prior_node) {
			this.moveToPriorNode(prior_node);
		} else {
			this.terminate();
		}
	}



	/**
	 * POWERING THE ABOVE
	 */

	canAdvance() {
		if (this.isTerminated()) {
			return false;
		}

		return (
			   this.currentNodeHasNextChild()
			|| this.currentNodeHasParent()
		);
	}

	isComplete() {
		if (!this.allowsPartialMatch() && this.hasRemainingStringLength()) {
			return false;
		}

		if (!this.nodeIsComplete(this.getRootNode())) {
			return false;
		}

		return true;
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




	/**
	 * CURRENT NODE
	 */

	setCurrentNode(current_node) {
		if (!current_node) {
			let type = current_node === null ? 'null' : typeof current_node;

			throw new Error(
				`Tried to set invalid value for current_node (got ${type})`
			);
		}

		/*
		console.log(' ');
		console.log(' ');
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log('> ' + current_node.getId());
		console.log('"' + this.getCurrentMatchString() + '"');
		console.log(JSON.stringify(current_node.toJSON(), null, 4));
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log(' ');
		console.log(' ');
		*/

		this.current_node = current_node;

		return this;
	}

	getCurrentNode() {
		return this.current_node;
	}

	currentNodeHasNextChild() {
		return this.nodeHasNextChild(this.getCurrentNode());
	}

	currentNodeIsRepeating() {
		return this.nodeIsRepeating(this.getCurrentNode());
	}

	currentNodeHasChildren() {
		return this.nodeHasChildren(this.getCurrentNode());
	}

	currentNodeHasParent() {
		return this.nodeHasParent(this.getCurrentNode());
	}

	setResultForCurrentNode(result) {
		return this.setResultForNode(this.getCurrentNode(), result);
	}

	disableAlternativesOfCurrentNode() {
		return this.disableAlternativesOfNode(this.getCurrentNode());
	}

	moveToParentOfCurrentNode() {
		return this.moveToParentOfNode(this.getCurrentNode());
	}

	addCurrentNodeToCompletedNodes() {
		this.addCompletedNode(this.getCurrentNode());
	}





	/**
	 * ROOT NODE
	 */


	getRootNode() {
		return this.root_node;
	}

	setRootNode(root_node) {
		this.root_node = root_node;

		this.initializeMetadata();

		return this.setCurrentNode(root_node);
	}

	isRootNode(node) {
		return node === this.getRootNode();
	}

	rootNodeHasChildren() {
		return this.nodeHasChildren(this.getRootNode());
	}









	/**
	 * GENERIC NODE BOOLEAN SELECTORS
	 */


	nodeIsComplete(node) {
		if (this.nodeHasChildren(node)) {
			let
				completed_count = this.getCompletedChildCountForNode(node),
				required_count  = this.getRequiredChildCountForNode(node);

			return completed_count >= required_count;
		}

		return this.nodeHasResult(node);
	}

	nodeIsRepeating(node) {
		return node.isRepeating();
	}

	nodeHasChildren(node) {
		var children = this.getChildrenOfNode(node);

		if (!children) {
			return false;
		}

		return children.length > 0;
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

	nodeHasAlternatives(node) {
		return this.getTotalAlternativesCountForNode(node) > 0;
	}

	nodeHasRemainingAlternatives(node) {
		return this.getRemainingAlternativesCountForNode(node) > 0;
	}

	nodeHasResult(node) {
		return this.getResultForNode(node) !== null;
	}

	nodeHasParent(node) {
		return this.getParentOfNode(node) !== null;
	}

	nodeHasRuleName(node) {
		return node.hasRuleName();
	}





	/**
	 * NODE GETTERS
	 */

	getResultForNode(node) {
		return this.getMetadataForNode(node).getResult();
	}

	getChildrenOfNode(node) {
		return node.getChildNodes();
	}

	getCompletedChildrenForNode(node) {
		return this.getChildrenOfNode(node).filter(this.nodeIsComplete, this);
	}

	getChildIndexForNode(node) {
		return this.getMetadataForNode(node).getChildIndex();
	}

	getChildCountForNode(node) {
		return this.getChildrenOfNode(node).length;
	}

	getParentOfNode(node) {
		return node.getParent();
	}





	/**
	 * NODE SETTERS
	 */

	incrementChildIndexForNode(node) {
		var index = this.getChildIndexForNode(node);

		index++;

		this.setChildIndexForNode(node, index);

		return index;
	}

	setChildIndexForNode(node, child_index) {
		return this.getMetadataForNode(node).setChildIndex(child_index);
	}

	setResultForNode(node, result) {
		return this.getMetadataForNode(node).setResult(result);
	}

	disableAlternativesOfNode(node) {
		if (!this.nodeHasParent(node)) {
			throw new Error('implement');
		}

		var parent_node = this.getParentOfNode(node);

		if (this.nodeHasAlternatives(parent_node)) {
			return this.clearRemainingAlternativesCountForNode(parent_node);
		} else {
			// ???
		}
	}


	/**
	 * METADATA
	 */

	initializeMetadata() {
		this.iterateOverAllNodes(this.initializeMetadataForNode);
	}

	initializeMetadataForNode(node) {
		this.setMetadataForNode(node, new NodeMetadata());
		this.initializeAlternativeCountsForNode(node);
	}



	getMetadataForNode(node) {
		return this.getMetadataForNodeId(node.getId());
	}

	getMetadataForNodeId(node_id) {
		return this.getMetadata()[node_id];
	}

	setMetadataForNode(node, metadata) {
		return this.setMetadataForNodeId(node.getId(), metadata);
	}

	setMetadataForNodeId(node_id, metadata) {
		this.getMetadata()[node_id] = metadata;
		return this;
	}

	getMetadata() {
		if (!this.metadata) {
			this.metadata = { };
		}

		return this.metadata;
	}









	/**
	 * STRING OPERATIONS
	 */

	getString() {
		return this.string || '';
	}

	setString(string) {
		this.string = string;
		return this;
	}

	getCurrentMatchString() {
		return this.getString().slice(this.getCurrentStringPosition());
	}

	getCurrentStringPosition() {
		return this.current_string_position;
	}

	setCurrentStringPosition(string_position) {
		this.current_string_position = string_position;
		return this;
	}

	incrementCurrentStringPosition(offset) {
		this.setCurrentStringPosition(this.getCurrentStringPosition() + offset);
	}

	hasRemainingStringLength() {
		return this.getCurrentStringPosition() < this.getStringLength();
	}

	getStringLength() {
		return this.getString().length;
	}

	getCompletedString() {
		return this.getString().slice(0, this.getCurrentStringPosition());
	}









	setRule(rule) {
		this.rule = rule;

		this.setRootNode(rule.getAST());

		return this;
	}







	setAllowsPartialMatch(allows_partial_match = true) {
		this.allows_partial_match = allows_partial_match;
		return this;
	}

	allowsPartialMatch() {
		return this.allows_partial_match;
	}



	terminate() {
		this.is_terminated = true;
	}

	isTerminated() {
		return this.is_terminated;
	}




	/**
	 * MATCHING LOGIC
	 */

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
		this.addCurrentNodeToCompletedNodes();
		this.disableAlternativesOfCurrentNode();

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





	/**
	 * NODE TRAVERSAL
	 */

	getLastPriorNodeWithRemainingAlternatives() {
		var
			completed_nodes = this.getCompletedNodes(),
			index           = completed_nodes.length;

		while (index--) {
			let completed_node = completed_nodes[index];

			if (this.nodeHasRemainingAlternatives(completed_node)) {
				return completed_node;
			} else {
				console.log('no alternatives:');
				console.log(JSON.stringify(completed_node.toJSON(), null, 4));
			}
		}

		return null;
	}


	moveToPriorNode(node) {
		var index = this.completed_nodes.indexOf(node);

		this.completed_nodes = this.completed_nodes.slice(0, index);

		this.setCurrentNode(node);
	}

	getCompletedNodes() {
		if (!this.completed_nodes) {
			this.completed_nodes = [ ];
		}

		return this.completed_nodes;
	}

	addCompletedNode(node) {
		var completed_nodes = this.getCompletedNodes();

		if (completed_nodes.indexOf(node) !== -1) {
			let node_id = node.getId();

			throw new Error(
				`Node was already marked as complete: ${node_id}`
			);
		}

		completed_nodes.push(node);

		return this;
	}

	moveToNextChildOfCurrentNode() {
		return this.moveToNextChildOfNode(this.getCurrentNode());
	}

	moveToNextChildOfNode(node) {
		var
			index      = this.incrementChildIndexForNode(node),
			child_node = this.getChildForNodeAtIndex(node, index);

		this.setCurrentNode(child_node);
	}

	getChildForNodeAtIndex(parent_node, index) {
		if (this.nodeIsRepeating(parent_node)) {
			return this.getFirstChildOfNode(parent_node);
		}

		var child_nodes = this.getChildrenOfNode(parent_node);

		return child_nodes[index];
	}

	moveToParentOfNode(node) {
		return this.setCurrentNode(this.getParentOfNode(node));
	}




	/**
	 * NODE COUNTS
	 */

	getCompletedChildCountForNode(node) {
		if (this.nodeIsRepeating(node)) {
			return this.getCompletedRepeatCountForNode(node);
		}

		return this.getCompletedChildrenForNode(node).length;
	}

	getRemainingAlternativesCountForNode(node) {
		return this.getMetadataForNode(node).getRemainingAlternativesCount();
	}

	setRemainingAlternativesCountForNode(node, count) {
		return this.getMetadataForNode(node).setRemainingAlternativesCount(count);
	}

	clearRemainingAlternativesCountForNode(node) {
		return this.setRemainingAlternativesCountForNode(node, 0);
	}

	getCompletedRepeatCountForNode(node) {
		return this.getMetadataForNode(node).getCompletedRepeatCount();
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

	getTotalAlternativesCountForNode(node) {
		return this.getMetadataForNode(node).getTotalAlternativesCount();
	}

	setTotalAlternativesCountForNode(node, count) {
		return this.getMetadataForNode(node).setTotalAlternativesCount(count);
	}

	getMinimumRepeatCountForNode(node) {
		return node.getMinRepeats();
	}

	getMaximumRepeatCountForNode(node) {
		return node.getMaxRepeats();
	}

	initializeAlternativeCountsForNode(node) {
		var count = 0;

		if (node.hasAlternatives() && this.nodeHasChildren(node)) {
			count = this.getChildCountForNode(node) - 1;
		}

		this.setRemainingAlternativesCountForNode(node, count);
		this.setTotalAlternativesCountForNode(node, count);
	}

}

extend(Match.prototype, {
	root_node:               null,
	allows_partial_match:    false,
	completed_nodes:         null,
	is_terminated:           false,
	current_string_position: 0
});



module.exports = Match;
