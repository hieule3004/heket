# Heket
#### *An ABNF parser for Node.js*


&nbsp;
### Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Rule matching](#rule-matching)
5. [Practical Example: IRC](#practical-example-irc)
5. [Impractical Example: ABNF](#impractical-example-abnf)
6. [Why Did You Write This?](#why-did-you-write-this)
7. [Where Did The Name Come From?](#where-did-the-name-come-from)


&nbsp;
### Overview

Heket is a parser generator for the [ABNF](https://tools.ietf.org/html/rfc5234)
specification, written in Node.js.

It allows you to create custom parsers for formal grammars written in ABNF,
and then apply those parsers to input text to see if it matches your rules.


&nbsp;
### Installation

`npm install heket`


&nbsp;
### Basic Usage

Let's say you had a basic ABNF rule:

`a = "foo" / "bar"`

You can use Heket to produce a custom parser from this simple grammar via the
following:

```js
var Heket = require('heket');

var abnf_string = 'a = "foo" / "bar"';

var parser = Heket.createParser(abnf_string);
```

Then you can use that parser to parse input text, to see if it matches the ABNF
that you originally specified. If the input text adheres to your grammar, then
`parse()` will return a match object with information about the matched result.
If the input text does not adhere to the grammar, `parse()` will return `null`.

```js
console.log(parser.parse('foo').string);
console.log(parser.parse('bar').string);
console.log(parser.parse('baz'));
```

The above snippet would print:

```js
"foo"
"bar"
null
```

&nbsp;
### Rule Matching

The above examples were pretty trivial; they just checked for matches against
basic strings. But Heket also allows you to unpack rule values from more complex
grammar definitions. The following snippet...

```js
var parser = Heket.createParser(`
    foo        = *(baz / bar) wat
    baz        = nested-baz
    nested-baz = "baz"
    bar        = "yyy"
    wat        = [*"z"]
`);

var input = 'xxxyyyzz';

var match = parser.parse('xxxyyyzz');

console.log(match.get('baz'));
console.log(match.get('nested-baz'));
console.log(match.get('bar'));
console.log(match.get('wat'));

console.log(match.getRawResult());
```

...would print the following output:

```js
"xxx"
"xxx"
"yyy"
"zz"

{
    "string": "xxxyyyzz",
    "rules": [
        {
            "rule_name": "baz",
            "string": "xxx",
            "rules": [
                {
                    "rule_name": "nested-baz",
                    "string": "xxx",
                    "rules": [ ]
                }
            ]
        },
        {
            "rule_name": "bar",
            "string": "yyy",
            "rules": [ ]
        },
        {
            "rule_name": "wat",
            "string": "zz",
            "rules": [ ]
        }
    ]
}
```


&nbsp;
### Practical example: IRC

Let's imagine we were running an IRC server, and we wanted to parse an incoming
message from a client. In that case, the following snippet...

```js
var rules = Heket.createParser(`
message           = [ ":" prefix " " ] command params CRLF
prefix            = nick [ "!" user ] [ "@" host ]
nick              = ( ALPHA / special-character) *(ALPHA / DIGIT / special-character / "-" )

host              = "burninggarden.com"
                    ; cheating for the purposes of this demonstration!
user              = "pachet"
                    ; cheating for the purposes of this demonstration!

command           = 1*ALPHA / 3DIGIT
params            = " " [ ( ":" trailing ) / ( middle params ) ]
middle            = param-octet *( ":" / param-octet )
trailing          = *( ":" / " " / param-octet )
param-octet       = %x01-09 / %x0B-0C / %x0E-1F / %x21-39 / %x3B-FF
                    ; any octet except NUL, CR, LF, ' ' and ':'

special-character = "-" / "[" / "]" / "\" / "\`" / "^" / "{" / "}"
`);

var input = `:pachet!pachet@burninggarden.com PRIVMSG #ops :Test message
`; // <-- Note the trailing CRLF here; this is required per the IRC spec.

var match = parser.parse(input);

console.log(match.get('prefix'));
console.log(match.get('nick'));
console.log(match.get('user'));
console.log(match.get('host'));
console.log(match.get('command'));
console.log(match.get('params'));
console.log(match.get('middle'));
console.log(match.get('trailing'));

console.log(match.getRawResult());
```

...would produce this output:


```js
"pachet!pachet@burninggarden.com"
"pachet"
"pachet"
"burninggarden.com"
"PRIVMSG"
" #ops :Test message"
"#ops"
"Test message"

{
    "string": ":pachet!pachet@burninggarden.com PRIVMSG #ops :Test message\n",
    "rules": [
        {
            "rule_name": "prefix",
            "string": "pachet!pachet@burninggarden.com",
            "rules": [
                {
                    "rule_name": "nick",
                    "string": "pachet",
                    "rules": []
                },
                {
                    "rule_name": "user",
                    "string": "pachet",
                    "rules": []
                },
                {
                    "rule_name": "host",
                    "string": "burninggarden.com",
                    "rules": []
                }
            ]
        },
        {
            "rule_name": "command",
            "string": "PRIVMSG",
            "rules": []
        },
        {
            "rule_name": "params",
            "string": " #ops :Test message",
            "rules": [
                {
                    "rule_name": "middle",
                    "string": "#ops",
                    "rules": [
                    ]
                },
                {
                    "rule_name": "params",
                    "string": " :Test message",
                    "rules": [
                        {
                            "rule_name": "trailing",
                            "string": "Test message",
                            "rules": [
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}
```

Notice: In the parsed result above, note how there are two instances of rule
results for the "params" rule. `match.get('params')` will only return the first
occurring result. If you need an array of all the matching results, use
`match.getAll()` instead:

```js
console.log(match.getAll('params'));
```

The above snippet would print:

```js
[
	" #ops :Test message",
	" :Test message"
]
```


&nbsp;
### Impractical Example: ABNF

As it turns out, it's possible to embody the formal specification for ABNF
grammars in ABNF syntax itself. And the authors of RFC-5234 actually set about
doing it. Here's the ABNF specification for ABNF:

```abnf
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
```

What this means is that we can use Heket to parse the formal ABNF grammar
specification upon which it is based. We can then use the resultant AST to
determine whether the ABNF specification... written in ABNF... is actually
valid ABNF.

```js
var spec = Heket.getSpec();

var abnf_parser = Heket.createParser(spec);

console.log(parser.parse(spec) !== null);
// Prints "true"; it's valid ABNF!
```

Now, honestly, we should hope that the authors of the ABNF specification would
be capable of embodying their own specification reflexively, so this exercise
is mostly useful as a demonstration of Heket's accurate implementation than
anything else. Still, it's an interesting mind game.


&nbsp;
### Why Did You Write This?

I needed a general-purpose ABNF parser in order to develop a better IRCD.
The grammar for the IRC specification is embodied in ABNF. Turns out it's much
less time consuming to just copy+paste the definitions from the spec as ABNF
literals and let the parser determine whether input messages to the IRC server
match the specified format, than to manually embody all of the logic of the
specification in the code directly. Whether or not it actually ends up being
performant to generate ASTs for every inbound message at runtime remains to be
seen :]


&nbsp;
### Where Did the Name Come From?

Heket (or Heqet) was an Egyptian fertility goddess. She was represented as a
woman with the head of a frog. I don't know what that has to do with parsing
formal grammars.

```

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

```
