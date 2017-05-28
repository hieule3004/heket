# Heket
#### *An ABNF parser for Node.js*


### Overview

Heket is a parser for the [ABNF](https://tools.ietf.org/html/rfc5234) specification, written in Node.js.

Actually, it's really two parsers in one:
- An ABNF syntax parser that uses the ABNF DSL specified in RFC 5234 to generate an AST representative of the rules specified in your input text
- A recursive descent parser that can match any input text to a set of rules generated from the above ABNF parser


### Basic Usage

Let's say you had a basic ABNF rule:

`a = "foo" / "bar"`

You could use Heket to produce an AST representation of this simple grammar via the following:

`````js
var Heket = require('heket');

var abnf_string = 'a = "foo" / "bar"';

var rule = Heket.parseRule(abnf_string);
`````

Then you could apply the result to other strings to see if they adhere to the rule:

`````js
var input = 'foo';

var match = rule.match('foo');

console.log(match);
// {
//     content: 'foo'
// }


var no_match = rule.match('baz');

console.log(no_match);
// null
`````


### Installation

`npm install heket`

### Why did you write this?

I needed a general-purpose ABNF parser in order to develop a better IRCD. The grammar for the IRC specification is embodied in ABNF. Turns out it's much less time consuming to just copy+paste the definitions from the spec as ABNF literals and let the parser determine whether input messages to the IRC server match the specified format, than to manually embody all of the logic of the specification in the code directly. Whether or not it actually ends up being performant to generate ASTs for every inbound message at runtime remains to be seen :]
