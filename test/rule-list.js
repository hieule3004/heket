
var
	Heket = require('../index');


function linkExternalRule(test) {
	test.expect(2);

	WithLinkedRule: {
		let external_rules = Heket.createRuleList(`
			foo = "bar"
		`);

		let local_rules = Heket.createRuleList(`
			baz = foo
		`, external_rules);

		let
			rule   = local_rules.getRule('baz'),
			parser = Heket.createParser(rule),
			match  = parser.parse('bar');

		test.deepEqual(match.getRawResult(), {
			string: 'bar',
			rules:  [
				{
					rule_name: 'foo',
					string: 'bar',
					rules: [ ]
				}
			]
		});
	}

	WithMissingRule: {
		// Throwing away the assignment, just to make sure there's a "foo" rule
		// *somewhere* in the dusty halls of memory:
		Heket.createRuleList(`
			foo = "bar"
		`);

		let local_rules = Heket.createRuleList(`
			baz = foo
		`);

		let
			rule   = local_rules.getRule('baz'),
			parser = Heket.createParser(rule);

		try {
			parser.parse('bar');
			test.ok(false, 'We should not be here');
		} catch (error) {
			test.equals(error.toString(), 'Error: Rule not found: foo');
		}
	}

	test.done();
}


module.exports = {
	linkExternalRule
};
