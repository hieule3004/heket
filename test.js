
var Heket = require('./index');

/*
var abnf = `
master = one " " two " " three
one = "foo" / "fim"
two = "bar" / "beh"
three = "baz" / "bek"
`;
*/

var abnf = `
master = one " " / two " " / three
`;



var rule = Heket.parse(abnf).getFirstRule();

var input = 'foo bar baz';

console.log(rule.parse(input));
