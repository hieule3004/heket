
var Heket = require('./index');

var Matcher = require('./lib/matcher');

var spec = `
a = 1*2(" " "b")
`;

var rules = Heket.parse(spec);

var node = rules.getFirstRule().getAST().child_nodes[0];

console.log(JSON.stringify(node.toJSON(), null, 4));

var matcher = new Matcher();

matcher.setNode(node);

console.log(matcher.matchString(' b b'));

/*
var match = rules.match(' b b');

console.log(JSON.stringify(match, null, 4));
*/

