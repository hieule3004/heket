export interface Match {
  getString(): string;
  get(ruleName: string): string | null;
  getAll(ruleName: string): string[];
  getNext(ruleName: string): string | null;
  getRawResult(): object;
}

export interface Parser {
  parse(input: string): Match;
  parseSafe(input: string): Match | null;
}

interface UnparseMap {
  [key: string]: string | string[] | UnparseMap;
}

interface UnparseCallback {
  (key: string, index: number): string | null | undefined;
}

export interface Unparser {
  unparse(input: UnparseCallback | UnparseMap): string;
}

export interface Rule {}

export interface RuleList {}

interface ParserError extends Error {
  getRuleName(): string | null;
  hasRuleName(): boolean;
  getValue(): string | null;
  hasValue(): boolean;
  getMessage(): string;
}

export interface InputTooLongError extends ParserError {}
export interface InputTooShortError extends ParserError {}
export interface InvalidQuotedStringError extends ParserError {}
export interface InvalidRuleValueError extends ParserError {}
export interface MissingRuleValueError extends ParserError {}
export interface NoMatchingAlternativeError extends ParserError {}
export interface NotEnoughOccurrencesError extends ParserError {}
export interface NumericValueMismatchError extends ParserError {}
export interface NumericValueOutOfRangeError extends ParserError {}
export interface RuleNotFoundError extends ParserError {}

export function createParser(
  abnfString: string | Rule,
  ruleList?: RuleList,
): Parser;

export function createUnparser(
  abnfString: string | Rule,
  ruleList?: RuleList,
): Unparser;

export function createRuleList(
  abnfString: string,
  ruleList?: RuleList,
): RuleList;

export function enableRegexCaching(): void;

export function disableRegexCaching(): void;
