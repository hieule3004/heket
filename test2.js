
var Match = require('./lib/match');

var match = new Match();

match.setRule({
	getAst: function() {
		var child_one = {
			getId() {
				return 'a';
			},
			getChildren() {
				return [ ];
			},
			getParent() {
				return parent;
			},
			hasRuleName() {
				return false;
			},
			hasQuotedString() {
				return true;
			},
			getQuotedString() {
				return 'ab';
			},
			hasAlternatives() {
				return true;
			}
		};

		var child_two = {
			getId() {
				return 'b';
			},
			getChildren() {
				return [ ];
			},
			getParent() {
				return parent;
			},
			hasRuleName() {
				return false;
			},
			hasQuotedString() {
				return true;
			},
			getQuotedString() {
				return 'cd';
			},
			hasAlternatives() {
				return false;
			}
		};

		var parent = {
			getId() {
				return 'c';
			},
			getChildren() {
				return [child_one, child_two];
			},
			getParent() {
				return null;
			},
			hasAlternatives() {
				return true;
			}
		};

		return parent;
	}
});

match.setString('c');

console.log(match.execute());
