
var
	Heket = require('../index');


function parseOneQuotedString(test) {
	test.expect(10);

	WithQuotedString: {
		let parser = Heket.createParser(`
			foo = "xxx"
		`);

		let match = parser.parse('xxx');

		test.deepEqual(match.getRawResult(), {
			string: 'xxx',
			rules:  [ ]
		});

		try {
			parser.parse('xxxy');
		} catch (error) {
			test.ok(error instanceof Heket.InputTooLongError);
			test.equals(error.getExpectedValue(), 'xxx');
			test.equals(error.getValue(), 'xxxy');
		}
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
					string: 'xxx'
				}
			]
		});

		test.equals(match.get('bar'), 'xxx');

		try {
			parser.parse('xx');
		} catch (error) {
			test.ok(error instanceof Heket.InvalidRuleValueError);
			test.equals(error.getValue(), 'xx');
			test.equals(error.getRuleName(), 'bar');
		}
	}

	test.done();
}

function parseTwoQuotedStrings(test) {

	test.expect(15);

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
					string: 'bar'
				},
				{
					rule_name: 'baz',
					string: 'baz'
				}
			]
		});

		test.equals(match.get('bar'), 'bar');
		test.equals(match.get('baz'), 'baz');

		try {
			parser.parse('bar');
		} catch (error) {
			test.ok(error instanceof Heket.MissingRuleValueError);
			test.equals(error.getRuleName(), 'baz');
		}
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
					string: 'bar'
				}
			]
		});

		test.equals(match.get('bar'), 'bar');

		try {
			parser.parse('foobaz');
		} catch (error) {
			test.ok(error instanceof Heket.InvalidRuleValueError);
			test.equals(error.getRuleName(), 'bar');
			test.equals(error.getValue(), 'foobaz');
		}
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

		try {
			parser.parse('barbaz');
		} catch (error) {
			test.ok(error instanceof Heket.InputTooLongError);
			test.equals(error.getExpectedValue(), 'bar');
			test.equals(error.getValue(), 'barbaz');
		}
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
					string: 'bar'
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
					string: 'bar'
				},
				{
					rule_name: 'baz',
					string: 'baz'
				}
			]
		});

		test.equals(match.get('bar'), 'bar');
		test.equals(match.get('baz'), 'baz');
	}

	test.done();
}

function parseRepeats(test) {
	test.expect(11);

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

		try {
			parser.parse('barbar');
		} catch (error) {
			test.ok(error instanceof Heket.NotEnoughOccurrencesError);
			test.equals(error.getExpectedCount(), 3);
			test.equals(error.getActualCount(), 2);
		}
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

		try {
			parser.parse('foobar');
		} catch (error) {
			test.ok(error instanceof Heket.InvalidQuotedStringError);
			test.equals(error.getQuotedString(), 'foobar');
			test.equals(error.getValue(), 'bar');
		}
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
				{ rule_name: 'baz', string: 'baz' },
				{ rule_name: 'bar', string: 'bar' },
				{ rule_name: 'bar', string: 'bar' },
				{ rule_name: 'baz', string: 'baz' },
				{ rule_name: 'baz', string: 'baz' },
				{ rule_name: 'baz', string: 'baz' },
				{ rule_name: 'bar', string: 'bar' },
				{ rule_name: 'bar', string: 'bar' }
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
	test.expect(12);

	SimpleNumerics: {
		let parser = Heket.createParser(`
			foo = %d97 %d98 %d99 ; some comment here
		`);

		let match = parser.parse('abc');

		test.deepEqual(match.getRawResult(), {
			string: 'abc',
			rules:  [ ]
		});

		try {
			parser.parse('ABC');
		} catch (error) {
			test.ok(error instanceof Heket.NumericValueMismatchError);
			test.equals(error.getExpectedCharCode(), 97);
			test.equals(error.getActualCharCode(), 65);
		}
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

		try {
			parser.parse('ac');
		} catch (error) {
			test.ok(error instanceof Heket.NotEnoughOccurrencesError);
			test.equals(error.getExpectedCount(), 3);
			test.equals(error.getActualCount(), 2);
		}
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

		try {
			parser.parse('abc');
		} catch (error) {
			test.ok(error instanceof Heket.NumericValueMismatchError);
			test.equals(error.getExpectedCharCode(), 99);
			test.equals(error.getActualCharCode(), 98);
		}
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
