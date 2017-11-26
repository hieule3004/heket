var
	Heket = require('../index');

function getNext(test) {
	test.expect(2);

	var parser = Heket.createParser(`
		foo = baz [ " " baz ]
		baz = "baz"
	`);

	var match = parser.parse('baz');

	test.equals(match.getNext('baz'), 'baz');
	test.equals(match.getNext('baz'), null);
	test.done();
}

module.exports = {
	getNext
};
