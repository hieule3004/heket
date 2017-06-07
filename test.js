

var Heket = require('./index');


var rules = Heket.parse(`
	foo = ("foobar" / "foo") "bar"
`);

var result = rules.match('foobar');

console.log(result);
