

var Heket = require('./index');

var rules = Heket.parse(`
	foo = 3%d97-99
`);

/*
var rules = Heket.parse(`
	foo = ("foobar" / "foo") "bar"
`);
*/


var result = rules.match('abc');

console.log(result);
