
var
	Heket = require('../index');


function unparseValid(test) {
	test.expect(1);

	var spec = `
		foo = 1*bar *(" " baz) [wat]
		bar = "bam"
		baz = "bal"
		wat = "WAT"
	`;

	var unparser = Heket.createUnparser(spec);

	var
		bar_index = 0,
		baz_index = 0;

	var string = unparser.unparse(function getRuleValue(rule_name) {
		switch (rule_name) {
			case 'bar':
				if (bar_index < 5) {
					bar_index++;
					return 'bam';
				}

				return null;

			case 'baz':
				if (baz_index < 3) {
					baz_index++;
					return 'bal';
				}

				return null;

			case 'wat':
			default:
				return null;
		}
	});

	test.equals(string, 'bambambambambam bal bal bal');
	test.done();
}

function unparseWithMissingRule(test) {
	test.expect(2);

	var spec = `
		foo = 1*bar [baz]
		bar = "bar"
		baz = "baz"
	`;

	var unparser = Heket.createUnparser(spec);

	try {
		unparser.unparse(function getRuleValue(rule_name) {
			switch (rule_name) {
				case 'baz':
					return 'baz';

				case 'bar':
				default:
					return null;
			}
		});
	} catch (error) {
		test.ok(error instanceof Heket.MissingRuleValueError);
		test.ok(error.getRuleName() === 'bar');
	}

	test.done();
}

function unparseWithInvalidRule(test) {
	test.expect(3);

	var spec = `
		foo = 1*bar [baz]
		bar = "bar"
		baz = "baz"
	`;

	var
		unparser  = Heket.createUnparser(spec),
		bar_count = 0;

	try {
		unparser.unparse(function getRuleValue(rule_name) {
			switch (rule_name) {
				case 'bar':
					if (bar_count < 2) {
						bar_count++;
						return 'bar';
					}

					return null;

				case 'baz':
					return 'zap';

				default:
					return null;

			}
		});
	} catch (error) {
		test.ok(error instanceof Heket.InvalidRuleValueError);
		test.ok(error.getRuleName() === 'baz');
		test.ok(error.getRuleValue() === 'zap');
	}

	test.done();
}

module.exports = {
	unparseValid,
	unparseWithMissingRule,
	unparseWithInvalidRule
};
