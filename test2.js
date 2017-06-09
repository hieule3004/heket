var Heket = require('./index');

var spec = `
x              =  repetition

repetition     =  [repeat] element

c-wsp          =  WSP / (c-nl WSP)

c-nl           =  comment / CRLF
					   ; comment or newline

comment        =  ";" *(WSP / VCHAR) CRLF

alternation    =  concatenation
				  *(*c-wsp "/" *c-wsp concatenation)

concatenation  =  repetition *(1*c-wsp repetition)

repeat         =  1*DIGIT / (*DIGIT "*" *DIGIT)

element        =  group / option /
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
`;

var rules = Heket.parse(spec);

// console.log(JSON.stringify(rules.getFirstRule().getAST().toJSON(), null, 4));

var match = rules.match('1*2"bar"');

console.log(JSON.stringify(match, null, 4));

