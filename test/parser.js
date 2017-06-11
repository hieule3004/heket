
var
	Heket = require('../index');

function getParserForRule(test) {
	test.expect(1);

	var foo_parser = Heket.createParser(`
		foo = bar
		baz = "baz"
	`);

	var baz_parser = foo_parser.getParserForRule('baz');

	var match = baz_parser.parse('baz');

	test.deepEqual(match.getRawResult(), {
		string: 'baz',
		rules:  [ ]
	});

	test.done();
}

function multilineAlternatives(test) {
	test.expect(1);

	var parser = Heket.createParser(`
		foo =  bar
		foo =/ baz
		bar =  "bar"
		baz =  "baz"
	`);

	var match = parser.parse('baz');

	test.deepEqual(match.getRawResult(), {
		string: 'baz',
		rules:  [
			{
				rule_name: 'baz',
				string: 'baz',
				rules: [ ]
			}
		]
	});

	test.done();
}

module.exports = {
	getParserForRule,
	multilineAlternatives
};
