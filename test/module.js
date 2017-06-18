
var
	Heket = require('../index');


function parseOneQuotedString(test) {
	test.expect(7);

	WithQuotedString: {
		let parser = Heket.createParser(`
			foo = "xxx"
		`);

		let match = parser.parse('xxx');

		test.deepEqual(match.getRawResult(), {
			string: 'xxx',
			rules:  [ ]
		});

		let non_match = parser.parse('xxxy');

		test.equals(non_match, null);
	}

	WithVaryingCase: {
		let parser = Heket.createParser(`
			foo = "xXx"
		`);

		let match = parser.parse('XxX');

		test.deepEqual(match.getRawResult(), {
			string: 'XxX',
			rules:  [ ]
		});
	}

	WithRule: {
		let parser = Heket.createParser(`
			foo = bar
			bar = baz
			baz = "xxx"
		`);

		let match = parser.parse('xxx');

		test.deepEqual(match.getRawResult(), {
			string: 'xxx',
			rules:  [
				{
					rule_name: 'bar',
					string: 'xxx',
					rules: [
						{
							rule_name: 'baz',
							string: 'xxx',
							rules: [ ]
						}
					]
				}
			]
		});

		test.equals(match.get('bar'), 'xxx');
		test.equals(match.get('baz'), 'xxx');

		let non_match = parser.parse('xx');

		test.equals(non_match, null);
	}

	test.done();
}

function parseTwoQuotedStrings(test) {

	test.expect(10);

	TwoRules: {
		let parser = Heket.createParser(`
			foo = bar baz
			bar = "bar"
			baz = "baz"
		`);

		let match = parser.parse('barbaz');

		test.deepEqual(match.getRawResult(), {
			string: 'barbaz',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				},
				{
					rule_name: 'baz',
					string: 'baz',
					rules:  [ ]
				}
			]
		});

		test.equals(match.get('bar'), 'bar');
		test.equals(match.get('baz'), 'baz');

		let non_match = parser.parse('bar');

		test.equals(non_match, null);
	}

	RuleAndQuotedString: {
		let parser = Heket.createParser(`
			foo = bar "baz"
			bar = "bar"
		`);

		let match = parser.parse('barbaz');

		test.deepEqual(match.getRawResult(), {
			string: 'barbaz',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				}
			]
		});

		test.equals(match.get('bar'), 'bar');

		let non_match = parser.parse('foobaz');

		test.equals(non_match, null);
	}

	RuleAndQuotedStringAlternatives: {
		let parser = Heket.createParser(`
			foo = bar / "baz"
			bar = "bar"
		`);

		let match = parser.parse('baz');

		test.deepEqual(match.getRawResult(), {
			string: 'baz',
			rules:  [ ]
		});

		test.equals(match.get('baz'), null);

		let non_match = parser.parse('barbaz');

		test.equals(non_match, null);
	}

	test.done();
}

function parseThreeQuotedStrings(test) {
	test.done();
}

function parseOptional(test) {
	test.expect(5);

	OptionalQuotedString: {
		let parser = Heket.createParser(`
			foo = bar ["baz"]
			bar = "bar"
		`);

		let match = parser.parse('bar');

		test.deepEqual(match.getRawResult(), {
			string: 'bar',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				}
			]
		});

		test.equals(match.get('bar'), 'bar');
	}

	OptionalRule: {
		let parser = Heket.createParser(`
			foo = bar [baz]
			bar = "bar"
			baz = "baz"
		`);

		let match = parser.parse('barbaz');

		test.deepEqual(match.getRawResult(), {
			string: 'barbaz',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				},
				{
					rule_name: 'baz',
					string: 'baz',
					rules:  [ ]
				}
			]
		});

		test.equals(match.get('bar'), 'bar');
		test.equals(match.get('baz'), 'baz');
	}

	test.done();
}

function parseRepeats(test) {
	test.expect(7);

	SimpleRepeat: {
		let parser = Heket.createParser(`
			foo = 3"bar"
		`);

		let input = 'barbarbar';

		let match = parser.parse(input);

		test.deepEqual(match.getRawResult(), {
			string: input,
			rules:  [ ]
		});

		let non_match = parser.parse('barbar');

		test.equals(non_match, null);
	}

	RepeatWithBacktracking: {
		let parser = Heket.createParser(`
			foo = 1*6"foo" "foobar"
		`);

		let match = parser.parse('foofoofoobar');

		test.deepEqual(match.getRawResult(), {
			string: 'foofoofoobar',
			rules:  [ ]
		});

		let non_match = parser.parse('foobar');

		test.equals(non_match, null);
	}

	RepeatWithNoMaxLimit: {
		let parser = Heket.createParser(`
			foo = 1*( bar / baz )
			bar = "bar"
			baz = "baz"
		`);

		let match = parser.parse('bazbarbarbazbazbazbarbar');

		test.deepEqual(match.getRawResult(), {
			string: 'bazbarbarbazbazbazbarbar',
			rules:  [
				{ rule_name: 'baz', string: 'baz', rules: [ ] },
				{ rule_name: 'bar', string: 'bar', rules: [ ] },
				{ rule_name: 'bar', string: 'bar', rules: [ ] },
				{ rule_name: 'baz', string: 'baz', rules: [ ] },
				{ rule_name: 'baz', string: 'baz', rules: [ ] },
				{ rule_name: 'baz', string: 'baz', rules: [ ] },
				{ rule_name: 'bar', string: 'bar', rules: [ ] },
				{ rule_name: 'bar', string: 'bar', rules: [ ] }
			]
		});

		test.deepEqual(match.getAll('bar'), [
			'bar',
			'bar',
			'bar',
			'bar'
		]);

		test.deepEqual(match.getAll('baz'), [
			'baz',
			'baz',
			'baz',
			'baz'
		]);
	}

	test.done();
}

function parseNumeric(test) {
	test.expect(6);

	SimpleNumerics: {
		let parser = Heket.createParser(`
			foo = %d97 %d98 %d99 ; some comment here
		`);

		let match = parser.parse('abc');

		test.deepEqual(match.getRawResult(), {
			string: 'abc',
			rules:  [ ]
		});

		let non_match = parser.parse('ABC');

		test.equals(non_match, null);
	}

	NumericRange: {
		let parser = Heket.createParser(`
			foo = 3%d97-99
		`);

		let match = parser.parse('abc');

		test.deepEqual(match.getRawResult(), {
			string: 'abc',
			rules:  [ ]
		});

		let non_match = parser.parse('ac');

		test.equals(non_match, null);
	}

	NumericConcatenation: {
		let parser = Heket.createParser(`
			foo = %d97.99.98
		`);

		let match = parser.parse('acb');

		test.deepEqual(match.getRawResult(), {
			string: 'acb',
			rules:  [ ]
		});

		let non_match = parser.parse('abc');

		test.equals(non_match, null);
	}

	test.done();
}

function parseComment(test) {
	test.expect(3);

	SimpleComment: {
		let rule_list = Heket.createRuleList(`
			foo = "bar" ; some comment
		`);

		let rule = rule_list.getRule('foo');

		test.equals(rule.getComment(), 'some comment');
	}

	MultilineComment: {
		let rule_list = Heket.createRuleList(`
			foo = "bar" ; one line
			      ; and another line
		`);

		let rule = rule_list.getRule('foo');

		test.equals(rule.getComment(), 'one line and another line');
	}

	CommentWithSemicolon: {
		let rule_list = Heket.createRuleList(`
			foo = "bar"
			      ; this is a comment; what a comment it is
		`);

		let rule = rule_list.getRule('foo');

		test.equals(
			rule.getComment(),
			'this is a comment; what a comment it is'
		);
	}

	test.done();
}

module.exports = {
	parseOneQuotedString,
	parseTwoQuotedStrings,
	parseThreeQuotedStrings,
	parseOptional,
	parseRepeats,
	parseNumeric,
	parseComment
};
