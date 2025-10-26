import { RawEmailInput, ParseResult } from './types.js';
import { parseLeadpoint } from './parsers/leadpoint.js';
import { parseLeadmail } from './parsers/leadmail.js';
import { parse3match } from './parsers/3match.js';
import { parseAdHelp } from './parsers/adhelp.js';

const parsers = [parseLeadpoint, parseLeadmail, parse3match, parseAdHelp];

export function runParsers(input: RawEmailInput): ParseResult | undefined {
  for (const p of parsers) {
    const result = p(input);
    if (result) return result;
  }
  return undefined;
}
