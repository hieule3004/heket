

var Heket = require('./index');

var rules = Heket.parse(`
	foo = 1*6"foo" "foobar"
`);

/*
var rules = Heket.parse(`
	foo = ("foobar" / "foo") "bar"
`);
*/


var result = rules.match('foobar');

console.log(result);
