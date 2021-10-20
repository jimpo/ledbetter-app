// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var NL: any;
declare var comma: any;
declare var int: any;
declare var decimal: any;
declare var WS: any;

import moo from 'moo';

const lexer = moo.compile({
  WS: /[ \t]+/,
  comma: /,/,
  decimal: /\-?[0-9]+\.[0-9]+/,
  int: /\-?[0-9]+/,
  word: /[a-zA-Z_][a-zA-Z_0-9]*/,
  NL: { match: /\n/, lineBreaks: true },
});

interface NearleyToken {
  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: never) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "main$ebnf$1$subexpression$1", "symbols": ["statement"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1$subexpression$1"]},
    {"name": "main$ebnf$1$subexpression$2", "symbols": ["statement"]},
    {"name": "main$ebnf$1", "symbols": ["main$ebnf$1", "main$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "main", "symbols": ["main$ebnf$1"], "postprocess": 
        ([statements]) => statements
          .map(([statement]: Array<object | null>) => statement)
          .filter((statement: object | null) => statement !== null)
        },
    {"name": "statement", "symbols": ["_", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": (_) => null},
    {"name": "statement", "symbols": [{"literal":"SET"}, "__", {"literal":"PIXELS_PER_METER"}, "__", "float", "_", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": (t) => {return { statement: "set_pixels_per_meter", value: t[4][0] }}},
    {"name": "statement", "symbols": [{"literal":"STRIP"}, "__", {"literal":"AT"}, "__", "float", {"literal":"m"}, "_", (lexer.has("comma") ? {type: "comma"} : comma), "_", "float", {"literal":"m"}, "_", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": (t) => {return { statement: "strip", x: t[4][0], y: t[9][0] }}},
    {"name": "statement", "symbols": [{"literal":"TURN"}, "__", "int", "__", {"literal":"degrees"}, "_", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": (t) => {return { statement: "turn", degrees: t[2] }}},
    {"name": "statement", "symbols": [{"literal":"SEGMENT"}, "__", "int", "__", {"literal":"pixels"}, "_", (lexer.has("NL") ? {type: "NL"} : NL)], "postprocess": (t) => {return { statement: "segment", nPixels: t[2] }}},
    {"name": "int", "symbols": [(lexer.has("int") ? {type: "int"} : int)], "postprocess": (t) => parseInt(t[0])},
    {"name": "float", "symbols": ["int"]},
    {"name": "float", "symbols": [(lexer.has("decimal") ? {type: "decimal"} : decimal)], "postprocess": (t) => parseFloat(t[0])},
    {"name": "__", "symbols": [(lexer.has("WS") ? {type: "WS"} : WS)], "postprocess": (_) => null},
    {"name": "_", "symbols": ["__"]},
    {"name": "_", "symbols": []}
  ],
  ParserStart: "main",
};

export default grammar;
