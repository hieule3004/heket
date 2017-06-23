# Heket 🐸
#### *An ABNF parser / unparser generator for Node.js*


&nbsp;
### Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Basic parsing](#basic-parsing)
4. [Rule matching](#rule-matching)
5. [Errors during parsing](#errors-during-parsing)
6. [Practical example: IRC](#practical-example-irc)
7. [Impractical example: ABNF](#impractical-example-abnf)
8. [Unparsing](#unparsing)
9. [Errors during unparsing](#errors-during-unparsing)
10. [Parsing + unparsing](#parsing-unparsing)
11. [Technical details](#technical-details)
12. [Why did you write this?](#why-did-you-write-this)
13. [Where did the name come from?](#where-did-the-name-come-from)


&nbsp;
### Overview

**Heket** is a parser generator for the [ABNF](https://tools.ietf.org/html/rfc5234)
specification, written in Node.js.

It allows you to create custom parsers for formal grammars written in ABNF,
and then apply those parsers to input text to see if it matches your rules.

You can also use it to create *unparsers*, which do the opposite of a parser:
given an ABNF grammar, the unparser will serialize a string using the rule
values that you supply to it.


&nbsp;
### Installation

`npm install heket`


&nbsp;
### Basic parsing

Let's say you had a basic ABNF rule:

`a = "foo" / "bar"`

You can use **Heket** to produce a custom parser from this simple grammar via
the following:

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

```
"foo"
"bar"

Error: no matching option for string: "baz"
a = "foo" / "bar"
----^
```

&nbsp;
### Rule matching

The above examples were pretty trivial; they just checked for matches against
basic strings. But **Heket** also allows you to unpack rule values from more
complex grammar definitions. The following snippet...

```js
var parser = Heket.createParser(`
    foo        = *(baz / bar) wat
    baz        = nested-baz
    nested-baz = "xxx"
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

Since all of the match values for each rule are stored internally as an array,
you can also use the convenience method `match.getNext()` to retrieve the next
value for the specified rule. For instance:

```js
var parser = Heket.createParser(`
    foo = 1*bar
    bar = "x"
`);

var match = parser.parse('xxxxx');

while (let next_result = match.getNext('bar')) {
    console.log(next_result);
}
```

The above would print:
```
"x"
"x"
"x"
"x"
"x"
```


&nbsp;
### Practical example: IRC

**IMPORTANT:** When you try to parse a string using a generated parser, and
for whatever reason, that string does not match the specified ABNF, Heket will
throw specific types of errors to indicate what type of mismatch occurred, and
where.

If uncaught, the error will print to the console and provide more information
about the mismatch, and the position in the current ABNF where the mismatch
was determined to occur.

Each of the following error types are exposed on the Heket module itself, so
you can type check thrown errors in order to determine what type of mismatch
scenario you're dealing with, eg:

```js
if (error instanceof Heket.RuleNotFoundError) { ... }
```

#### InvalidRuleValueError

```js
var parser = Heket.createParser(`
	foo = bar
	bar = "baz"
`);

parser.parse('bam');
```

```
Error: Invalid value for rule <bar>: "bam"
foo = bar
------^
```

#### MissingRuleValueError

```js
var parser = Heket.createParser(`
	foo = bar baz
	bar = "bar"
	baz = "baz"
`);

parser.parse('bar');
```

```
Error: Must supply a value for rule <baz>
foo = bar baz
----------^
```

#### RuleNotFoundError

```js
var parser = Heket.createParser(`
	foo = bar baz
	bar = "bar"
`);

parser.parse('barbaz');
```

```
Error: Rule not found: <baz>
foo = bar baz
----------^
```

#### InvalidQuotedStringError

```js
var parser = Heket.createParser(`
	foo = "bar"
`);

parser.parse('baz');
```

```
Error: Invalid value for quoted string (expected "bar" but got "baz")
foo = "bar"
------^
```

#### InputTooLongError

```js
var parser = Heket.createParser(`
	foo = "bar"
`);

parser.parse('barbaz');
```

```
Error: Too much text to match (expected "bar", got "barbaz")
foo = "bar"
------^
```

#### InputTooShortError

```js
var parser = Heket.createParser(`
	foo = "bar" "baz"
`);

parser.parse('bar');
```

```
Error: Not enough text to match
foo = "bar" "baz"
------------^
```

#### NoMatchingAlternativeError

```js
var parser = Heket.createParser(`
	foo = "bar" / "baz"
`);

parser.parse('bam');
```

```
Error: No matching option for string: "bam"
foo = "bar" / "baz"
------^
```

#### NotEnoughOccurrencesError

```js
var parser = Heket.createParser(`
	foo = 3"bar"
`);

parser.parse('barbar');
```

```
Error: Not enough occurrences of repeating clause (expected 3, got 2)
foo = 3"bar"
------^
```

#### NumericValueMismatchError

```js
var parser = Heket.createParser(`
	foo = %d65 ; A
`);

parser.parse('B');
```

```
Error: Numeric value did not match (expected 65 / A, got 66 / B)
foo = %d65
------^
```

#### NumericValueOutOfRangeError

```js
var parser = Heket.createParser(`
	foo = %d65 - 67 ; A - C
`);

parser.parse('D');
```

```
Error: Numeric value out of range (expected value within [65 - 67], got 68 / D)
foo = %d65-57
------^
```

#### parseSafe()

If you're not interested in error handling, you can use the `parser.parseSafe()`
convenience method. It basically just wraps `parse()` in a `try { }` block,
swallows the error, and returns null instead of a match instance.


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

*Notice*: In the parsed result above, there are two instances of rule results
for the "params" rule. `match.get('params')` will only return the first
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
### Impractical example: ABNF

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

What this means is that we can use **Heket** to parse the formal ABNF grammar
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
is mostly useful as a demonstration of **Heket's** accurate implementation than
anything else. Still, it's an interesting mind game.


&nbsp;
### Unparsing

In addition to allowing you to create generate custom parsers for ABNF-based
grammars, **Heket** also lets you *unparse* a series of tokens (read: serialize
a string based on the rules defined in your grammar).

The way this works is: **Heket** will walk over each node in the AST used to
represent your grammar. Whenever it encounters a node linking to a named rule,
it will prompt you to supply it with the value of that rule, like so:

```js
// Like createParser(), createUnparser() accepts an ABNF string:
var unparser = Heket.createUnparser(`
    foo = bar baz
    bar = "bar"
    baz = "baz"
`);

var string = unparser.unparse(function(rule_name, index) {
    switch (rule_name) {
        case 'bar':
            return 'bar';
        case 'baz':
            return 'baz';
        default:
            return null;
    }
});

console.log(string);
```

The above would print `"barbaz"`.

Notice how the only argument passed to `unparser.unparse()` is a function that
receives two arguments: the name of the rule the unparser is requesting a value
for, and a numeric index. The numeric index represents the number of times that
the unparser has requested a value for that same rule name.

The index argument makes it easy to hand values back to the parser if you're
dealing with, say, an array of strings:

```js
var unparser = Heket.createUnparser(`
    foo = 1*bar [baz] wat
    bar = "bar"
    baz = "baz"
    wat = "wat"
`);

var rule_values = {
    bar: ['bar', 'bar', 'bar', 'bar', 'bar'],
    baz: [ ],
    wat: ['wat']
};

var string = unparser.unparse(function(rule_name, index) {
    return rule_values[rule_name][index];
});

console.log(string);
```

The above would print `"barbarbarbarbarwat"`.

**NOTE**: You can also pass an object to `unparser.unparse()`, whose keys are
rule names, and whose values are arrays of strings to use as values for that
rule whenever the unparser encounters it. To modify the above example:

```js
var unparser = Heket.createUnparser(`
    foo = 1*bar [baz] wat
    bar = "bar"
    baz = "baz"
    wat = "wat"
`);

var rule_values = {
    bar: ['bar', 'bar', 'bar', 'bar', 'bar'],
    baz: [ ],
    wat: ['wat']
};

var string = unparser.unparse(rule_values);

console.log(string);
```

Again, same result as before: `"barbarbarbarbarwat"`.


&nbsp;
### Errors during unparsing
Sometimes when you try to unparse something, the values you supply to the
unparser won't match the rules they're meant to fill. Or, the unparser will
expect a value for a rule, but you fail to give it one, so it will be unable
to proceed. In each of these cases, **Heket** will throw a specific type of
error to signal that the unparsing step failed.

These error types also have some additional convenience methods to help you
track down the source of unparsing issues:

- `error.getRuleName()`
- `error.getValue()`


#### InvalidRuleValueError

**Heket** will throw an `InvalidRuleValueError` when the value you return for
a specific rule during unparsing doesn't match the ABNF definition for that
rule. For instance:

```js
var unparser = Heket.createUnparser(`
    foo = bar
    bar = "bar"
`);

var string;

try {
    string = unparser.unparse(function(rule_name) {
        switch (rule_name) {
            case 'bar':
                // Notice how this is invalid per the ABNF spec above:
                return 'baz';

            default:
                return null;
        }
    });
} catch (error) {
    console.log(error instanceof Heket.InvalidRuleValueError);
    console.log(error.getRuleName());
    console.log(error.getValue());
}
```

The above would print:
```
true
"bar"
"baz"
```


#### MissingRuleValueError

**Heket** will throw a `MissingRuleValueError` when the unparser isn't given a
value for a required rule. For instance:

```js
var unparser = Heket.createUnparser(`
    foo = bar
    bar = "bar"
`);

var string;

try {
    string = unparser.unparse(function(rule_name) {
        // Return null, no matter what, even though "bar" is required.
        return null;
    });
} catch (error) {
    console.log(error instanceof Heket.MissingRuleValueError);
    console.log(error.getRuleName());
    console.log(error.getValue());
}
```

The above would print:
```
true
"bar"
null
```


&nbsp;
### Parsing + unparsing

Where things get fun is when you combine parsers with unparsers. By the way,
you can also obtain a reference to the unparser for an ABNF declaration from
the associated parser, via `parser.getUnparser()`.

```js
var parser = Heket.createParser(`
    foo = 1*bar [baz] wat
    bar = "bar"
    baz = "baz"
    wat = "wat"
`);

var match = parser.parse('barbarbarbarbarbazwat');

var unparser = parser.getUnparser();

var output = unparser.unparse(function(rule_name, index) {
    return match.getNext(rule_name);
});

console.log(input === output);
// true
```

You can also just pass `match.getNext()` to `unparser.unparse()` directly
(don't worry, the context is bound for you):

```js
var output = unparser.unparse(match.getNext);
```


&nbsp;
### Technical details

#### Backtracking

Technically, Heket generates recursive descent parsers with support for
backtracking. This means that a generated parser is able to walk backwards
and re-parse previously matched portions of input strings if it realizes that
it went down a blind alley. Take the following trivial example:

```abnf
foo = 1*"foo" "foobar"
```

The above rule will greedily match the string `"foo"` as many times as it can
before proceeding to check for the existence of a `"foobar"` occurrence. Now,
without proper backtracking, the parser would never be able to match the string
`"foobar"` at the end of the input, because it would already have consumed the
`"foo"` portion when parsing the prior segment. In other words, this would fail:

```js
parser.parse('foofoofoobar');
```

With backtracking, the parser algorithm is able to realize that it went one
step too far, and that it needs to relinquish one of the `"foo"` substrings
in order to properly match the tail segment.


#### No parser combinator?

Heket doesn't use a proper parser combinator for a handful of technical reasons.

&nbsp;
### Why did you write this?

I needed a general-purpose ABNF parser in order to develop a better IRCD.
The grammar for the IRC specification is embodied in ABNF. Turns out it's much
less time consuming to just copy+paste the definitions from the spec as ABNF
literals and let the parser determine whether input messages to the IRC server
match the specified format, than to manually embody all of the logic of the
specification in the code directly. Whether or not it actually ends up being
performant to generate ASTs for every inbound message at runtime remains to be
seen :]


&nbsp;
### Where did the name come from?

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
