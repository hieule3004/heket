
var
	Heket = require('../index');


function testABNFSpec(test) {
	test.expect(1);

	var
		spec   = Heket.getSpec(),
		parser = Heket.createParser(spec),
		match  = parser.parseSafe(spec);

	test.ok(match !== null);

	test.done();
}

module.exports = {
	testABNFSpec
};
