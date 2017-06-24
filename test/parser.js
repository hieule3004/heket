
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

function missingRuleDefinitionWithinAlternativeClause(test) {
	test.expect(2);

	var parser = Heket.createParser(`
		foo = ( bar / baz )
		bar = bam ; Notice that bam is never defined
		baz = wat
		wat = "wat"
	`);

	// The parser should not swallow errors due to alternative expansion of
	// rules that themselves contain references to undefined rules.
	// When parsing alternative clauses, other types of errors that might be
	// thrown are normally suppressed, and the offending option bypassed.
	// This suppression should not apply to instances of RuleNotFoundError.
	try {
		parser.parse('wat');
		test.ok(false, 'We should not be here');
	} catch (error) {
		test.ok(error instanceof Heket.RuleNotFoundError);
		test.equals(error.getRuleName(), 'bam');
	}

	test.done();
}

module.exports = {
	getParserForRule,
	multilineAlternatives,
	missingRuleDefinitionWithinAlternativeClause
};
