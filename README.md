# Heket
#### *An ABNF parser for Node.js*


### Overview

Heket is a parser for the [ABNF](https://tools.ietf.org/html/rfc5234) specification, written in Node.js.

Actually, it's really two parsers in one:
- An ABNF syntax parser that uses the ABNF DSL specified in RFC 5234 to generate an AST representative of the rules specified in your input text
- A recursive descent parser that can match any input text to a set of rules generated from the above ABNF parser



### Installation

`npm install heket`

### Why did you write this?

I needed a general-purpose ABNF parser in order to develop a better IRCD. The IRC specification is embodied in ABNF and it's much less time consuming to just copy+paste the definitions from the spec as ABNF literals and let the parser determine whether input messages to the IRC server match the specified format, than to manually embody all of the logic of the specification in the code directly.
