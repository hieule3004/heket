
var
	Heket = require('../index');


function parseOneQuotedString(test) {
	test.expect(5);

	WithQuotedString: {
		let rules = Heket.parse(`
			foo = "xxx"
		`);

		let matching_result = rules.match('xxx');

		test.deepEqual(matching_result, {
			string: 'xxx',
			rules:  [ ]
		});

		let non_matching_result = rules.match('xxxy');

		test.equals(non_matching_result, null);
	}

	WithVaryingCase: {
		let rules = Heket.parse(`
			foo = "xXx"
		`);

		let matching_result = rules.match('XxX');

		test.deepEqual(matching_result, {
			string: 'XxX',
			rules:  [ ]
		});
	}

	WithRule: {
		let rules = Heket.parse(`
			foo = bar
			bar = baz
			baz = "xxx"
		`);

		let matching_result = rules.match('xxx');

		test.deepEqual(matching_result, {
			string: 'xxx',
			rules:  [
				{
					rule_name: 'bar',
					string: 'xxx',
					rules: [
						{
							rule_name: 'baz',
							string: 'xxx',
							rules: { }
						}
					]
				}
			]
		});

		let non_matching_result = rules.match('xx');

		test.equals(non_matching_result, null);
	}

	test.done();
}

function parseTwoQuotedStrings(test) {

	test.expect(6);

	TwoRules: {
		let rules = Heket.parse(`
			foo = bar baz
			bar = "bar"
			baz = "baz"
		`);

		let matching_result = rules.match('barbaz');

		test.deepEqual(matching_result, {
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

		let non_matching_result = rules.match('bar');

		test.equals(non_matching_result, null);
	}

	RuleAndQuotedString: {
		let rules = Heket.parse(`
			foo = bar "baz"
			bar = "bar"
		`);

		let matching_result = rules.match('barbaz');

		test.deepEqual(matching_result, {
			string: 'barbaz',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				}
			]
		});

		let non_matching_result = rules.match('foobaz');

		test.equals(non_matching_result, null);
	}

	RuleAndQuotedStringAlternatives: {
		let rules = Heket.parse(`
			foo = bar / "baz"
			bar = "bar"
		`);

		let matching_result = rules.match('baz');

		test.deepEqual(matching_result, {
			string: 'baz',
			rules:  [ ]
		});

		let non_matching_result = rules.match('barbaz');

		test.equals(non_matching_result, null);
	}

	test.done();
}

function parseThreeQuotedStrings(test) {
	test.done();
}

function parseOptional(test) {
	test.expect(2);

	OptionalQuotedString: {
		let rules = Heket.parse(`
			foo = bar ["baz"]
			bar = "bar"
		`);

		let matching_result = rules.match('bar');

		test.deepEqual(matching_result, {
			string: 'bar',
			rules:  [
				{
					rule_name: 'bar',
					string: 'bar',
					rules: [ ]
				}
			]
		});
	}

	OptionalRule: {
		let rules = Heket.parse(`
			foo = bar [baz]
			bar = "bar"
			baz = "baz"
		`);

		let matching_result = rules.match('barbaz');

		test.deepEqual(matching_result, {
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
	}

	test.done();
}

function parseRepeats(test) {
	test.expect(5);

	SimpleRepeat: {
		let rules = Heket.parse(`
			foo = 3"bar"
		`);

		let input = 'barbarbar';

		let matching_result = rules.match(input);

		test.deepEqual(matching_result, {
			string: input,
			rules:  [ ]
		});

		let non_matching_result = rules.match('barbar');

		test.equals(non_matching_result, null);
	}

	RepeatWithBacktracking: {
		let rules = Heket.parse(`
			foo = 1*6"foo" "foobar"
		`);

		let matching_result = rules.match('foofoofoobar');

		test.deepEqual(matching_result, {
			string: 'foofoofoobar',
			rules:  [ ]
		});

		let non_matching_result = rules.match('foobar');

		test.equals(non_matching_result, null);
	}

	RepeatWithNoMaxLimit: {
		let rules = Heket.parse(`
			foo = 1*( bar / baz )
			bar = "bar"
			baz = "baz"
		`);

		let matching_result = rules.match('bazbarbarbazbazbazbarbar');

		test.deepEqual(matching_result, {
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
	}

	test.done();
}

function parseNumeric(test) {
	test.expect(6);

	SimpleNumerics: {
		let rules = Heket.parse(`
			foo = %d97 %d98 %d99 ; some comment here
		`);

		let matching_result = rules.match('abc');

		test.deepEqual(matching_result, {
			string: 'abc',
			rules:  [ ]
		});

		let non_matching_result = rules.match('ABC');

		test.equals(non_matching_result, null);
	}

	NumericRange: {
		let rules = Heket.parse(`
			foo = 3%d97-99
		`);

		let matching_result = rules.match('abc');

		test.deepEqual(matching_result, {
			string: 'abc',
			rules:  [ ]
		});

		let non_matching_result = rules.match('ac');

		test.equals(non_matching_result, null);
	}

	NumericConcatenation: {
		let rules = Heket.parse(`
			foo = %d97.99.98
		`);

		let matching_result = rules.match('acb');

		test.deepEqual(matching_result, {
			string: 'acb',
			rules:  [ ]
		});

		let non_matching_result = rules.match('abc');

		test.equals(non_matching_result, null);
	}

	test.done();
}


module.exports = {
	parseOneQuotedString,
	parseTwoQuotedStrings,
	parseThreeQuotedStrings,
	parseOptional,
	parseRepeats,
	parseNumeric
};
