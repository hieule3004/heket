
var
	Heket = require('../index');


function testABNFSpec(test) {
	test.expect(1);

	var
		spec  = Heket.getSpec(),
		rules = Heket.parse(spec),
		match = rules.match(spec);

	test.ok(match !== null);

	test.done();
}

module.exports = {
	testABNFSpec
};
