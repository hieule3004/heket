# Heket
#### *An ABNF parser for Node.js*


### Overview

Heket is a parser for the [ABNF](https://tools.ietf.org/html/rfc5234) specification, written in Node.js.

Actually, it's really two parsers in one:
- An ABNF syntax parser that uses the ABNF DSL specified in RFC 5234 to generate an AST representative of the rules specified in your input text
- A recursive descent parser that can match any input text to a set of rules generated from the above ABNF parser


### Installation

`npm install heket`


### Basic Usage

Let's say you had a basic ABNF rule:

`a = "foo" / "bar"`

You can use Heket to produce an AST representation of this simple grammar via the following:

`````js
var Heket = require('heket');

var abnf_string = 'a = "foo" / "bar"';

var rule = Heket.parseRule(abnf_string);
`````

Then you can check the result against other strings to see if they adhere to the rule:

`````js
console.log(rule.match('foo'));
// { string: 'foo' }

console.log(rule.match('bar'));
// { string: 'bar' }

console.log(rule.match('baz'));
// null
`````


### Parsing the ABNF Spec

Turns out it's possible to embody the formal specification for ABNF grammars
in ABNF syntax itself. And the authors of RFC-5234 actually set about doing it.
Here's the ABNF specification for ABNF:

`````abnf
rulelist       =  1*( rule / (*c-wsp c-nl) )

rule           =  rulename defined-as elements c-nl
					   ; continues if next line starts
					   ;  with white space

rulename       =  ALPHA *(ALPHA / DIGIT / "-")

defined-as     =  *c-wsp ("=" / "=/") *c-wsp
					   ; basic rules definition and
					   ;  incremental alternatives

elements       =  alternation *c-wsp

c-wsp          =  WSP / (c-nl WSP)

c-nl           =  comment / CRLF
					   ; comment or newline

comment        =  ";" *(WSP / VCHAR) CRLF

alternation    =  concatenation
				  *(*c-wsp "/" *c-wsp concatenation)

concatenation  =  repetition *(1*c-wsp repetition)

repetition     =  [repeat] element

repeat         =  1*DIGIT / (*DIGIT "*" *DIGIT)

element        =  rulename / group / option /
				  char-val / num-val / prose-val

group          =  "(" *c-wsp alternation *c-wsp ")"

option         =  "[" *c-wsp alternation *c-wsp "]"

char-val       =  DQUOTE *(%x20-21 / %x23-7E) DQUOTE
					   ; quoted string of SP and VCHAR
					   ;  without DQUOTE

num-val        =  "%" (bin-val / dec-val / hex-val)

bin-val        =  "b" 1*BIT
				  [ 1*("." 1*BIT) / ("-" 1*BIT) ]
					   ; series of concatenated bit values
					   ;  or single ONEOF range

dec-val        =  "d" 1*DIGIT
				  [ 1*("." 1*DIGIT) / ("-" 1*DIGIT) ]

hex-val        =  "x" 1*HEXDIG
				  [ 1*("." 1*HEXDIG) / ("-" 1*HEXDIG) ]

prose-val      =  "<" *(%x20-3D / %x3F-7E) ">"
					   ; bracketed string of SP and VCHAR
					   ;  without angles
					   ; prose description, to be used as
					   ;  last resort
`````

What this means is that we can use Heket to parse the formal ABNF grammar
specification upon which it is based. We can then use the resultant AST to
determine whether the ABNF specification... written in ABNF... is actually
valid ABNF.

`````js
var Heket = require('heket');

// Make-believe method; just imagine this returns a string that contains
// the ABNF lines from directly above this code sample.
var spec = readFile('./abnf.abnf');

var rules = Heket.parse(spec);

if (rules.match(spec)) {
	// It's valid ABNF!
}
`````

Now, honestly, we should hope that the authors of the ABNF specification would
be capable of embodying their own specification reflexively, so this exercise
is mostly useful as a demonstration of Heket's accurate implementation than
anything else. Still, it's an interesting mind game.




### Why did you write this?

I needed a general-purpose ABNF parser in order to develop a better IRCD.
The grammar for the IRC specification is embodied in ABNF. Turns out it's much
less time consuming to just copy+paste the definitions from the spec as ABNF
literals and let the parser determine whether input messages to the IRC server
match the specified format, than to manually embody all of the logic of the
specification in the code directly. Whether or not it actually ends up being
performant to generate ASTs for every inbound message at runtime remains to be
seen :]


### Where did the name come from?

Heket (or Heqet) was an Egyptian fertility goddess. She was represented as a
woman with the head of a frog. I don't know what that has to do with parsing
formal grammars.

`````

         +++++++++++++++++++
       ++++         +++   +++
       ++                 +++++++
       ++++++  +++            +++++++
       +++++++++++++             +++++++++
        +++++++++++++                  +++++++++
         +++++++++++++                      ++++++++
           ++++++++ +++                          ++++++
            +++++    ++++                           ++++++
               ++      ++++                            +++++
               +++       +++                             +++++
                +++                                        ++++
                +++                                          ++++
                 +++                                      +++  +++
                  ++                                      +++++ ++++
                  ++++                                      ++++  +++
                    +++   ++                                  ++++ +++
                     ++++ +++   ++                              +++ +++
                       ++++++   ++                               +++++++
                         ++++   ++               +++++++++         ++++++
                           ++   ++              ++++   +++++++      +++++
                           ++  +++              ++     ++  ++++++    +++++
                          +++ ++++++            ++    ++++++  ++++++ +++++
                         +++ +++ +++++   +  ++  ++++     +++++++ +++  ++++
          +++++++++     +++  +++    ++++++++++++++++++++     +++++++  ++++
       +++++++++++++++++++  +++      ++++++++++++++++++++++++++  +++++ +++
       +++++++++++++++++++++++        +++++++++++++++++++++++++++   +++++
       +++++++++++++++++++++               +++++++++++++++++++++++++++++
               +++                         ++++           +++++++++++

`````
