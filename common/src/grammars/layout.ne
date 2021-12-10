@preprocessor typescript

@{%
import moo from 'moo';

const lexer = moo.compile({
  WS: /[ \t]+/,
  comma: /,/,
  decimal: /\-?[0-9]+\.[0-9]+/,
  int: /\-?[0-9]+/,
  word: /[a-zA-Z_][a-zA-Z_0-9]*/,
  NL: { match: /\n/, lineBreaks: true },
});
%}

@lexer lexer

main -> (statement):+ {%
  ([statements]) => statements
    .map(([statement]: Array<object | null>) => statement)
    .filter((statement: object | null) => statement !== null)
%}
statement ->
    _ %NL {% (_) => null %}
  | "SET" __ "PIXELS_PER_METER" __ float _ %NL
      {% (t) => {return { statement: "set_pixels_per_meter", value: t[4] }} %}
  | "STRIP" __ "AT" __ float "m" _ %comma _ float "m" _ %NL
      {% (t) => {return { statement: "strip", x: t[4], y: t[9] }} %}
  | "TURN" __ float __ "degrees" _ %NL
      {% (t) => {return { statement: "turn", degrees: t[2] }} %}
  | "SEGMENT" __ int __ "pixels" _ %NL
      {% (t) => {return { statement: "segment", nPixels: t[2] }} %}

int -> %int {% (t) => parseInt(t[0]) %}
float ->
    %int {% (t) => parseFloat(t[0]) %}
  | %decimal {% (t) => parseFloat(t[0]) %}
__ -> %WS {% (_) => null %}
_ -> __ | null
