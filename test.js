
var Heket = require('./index');

/*
var abnf = `
master = (one / four) " " two " " three
one = "foo" / "fim"
two = "bar" / "beh"
three = "baz" / "bek"
`;
*/

var abnf = `
one = a / b
a = "foo"
b = "bar"
`;


var rule = Heket.parse(abnf).getFirstRule();

var input = 'bar';

console.log(rule.match(input));

/*
{
	content: 'fooxxx',
	length: 6
}
*/
