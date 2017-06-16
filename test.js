var Heket = require('./index');

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
			return 'WAT';

		default:
			return null;
	}
});

console.log(string);
