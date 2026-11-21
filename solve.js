// Faster drop-in for csv-reader 1.0.0 (make.fun's reference CSV reader).
// Same answers on every input, single pass, left to right, with the whole
// parser inlined in one function (no per-field calls): unquoted fields are
// sliced between delimiters, quoted fields jump to the closing quote with
// indexOf, and line counting inside quotes comes from the value itself —
// after CRs are normalised to LF, every line break in a quoted field is
// exactly one LF in the value, so one indexOf scan counts them.
// Pure: no clock, no randomness, no locale, nothing kept between calls.

const COMMA = 44;
const LF = 10;
const CR = 13;
const QUOTE = 34;
const BOM = 0xFEFF;

const END_COMMA = 0;
const END_BREAK = 1;
const END_EOF = 2;

export function run(input) {
  const text = String(input.text);
  const header = input.header === true;
  const n = text.length;
  const errors = [];
  const rows = [];
  let columns = null;
  let width = -1;

  let pos = 0;
  let line = 1;
  if (n > 0 && text.charCodeAt(0) === BOM) pos = 1;

  let recordLine = 1;
  let recordRow = null;

  while (true) {
    while (pos < n) {
      const c = text.charCodeAt(pos);
      if (c === LF) {
        pos += 1;
        line += 1;
      } else if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
        pos += 2;
        line += 1;
      } else {
        break;
      }
    }
    if (pos >= n) break;

    recordLine = line;
    recordRow = header && columns === null ? null : rows.length;
    const fields = [];
    let quoted = false;
    let ended = END_EOF;
    do {
      quoted = text.charCodeAt(pos) === QUOTE;
      let value = '';
      let needScan = true;
      let junkCheck = false;
      if (quoted) {
        const open = pos;
        const openLine = line;
        let q = pos + 1;
        let hasDoubled = false;
        let close = -1;
        for (;;) {
          const cand = text.indexOf('"', q);
          if (cand === -1) break;
          if (cand + 1 < n && text.charCodeAt(cand + 1) === QUOTE) {
            hasDoubled = true;
            q = cand + 2;
            continue;
          }
          close = cand;
          break;
        }
        if (close === -1) {
          pos = open + 1;
          line = openLine;
          errors.push({ code: 'unterminated_quote', line: recordLine, row: recordRow });
          value = '"';
        } else {
          let v = text.slice(open + 1, close);
          if (hasDoubled) v = v.replace(/""/g, '"');
          if (v.indexOf('\r') !== -1) v = v.replace(/\r\n?/g, '\n');
          let p = 0;
          let breaks = 0;
          for (;;) {
            const a = v.indexOf('\n', p);
            if (a === -1) break;
            breaks += 1;
            p = a + 1;
          }
          line += breaks;
          pos = close + 1;
          if (pos >= n) {
            value = v;
            ended = END_EOF;
            needScan = false;
          } else {
            const c = text.charCodeAt(pos);
            if (c === COMMA) {
              pos += 1;
              value = v;
              ended = END_COMMA;
              needScan = false;
            } else if (c === LF) {
              pos += 1;
              line += 1;
              value = v;
              ended = END_BREAK;
              needScan = false;
            } else if (c === CR && pos + 1 < n && text.charCodeAt(pos + 1) === LF) {
              pos += 2;
              line += 1;
              value = v;
              ended = END_BREAK;
              needScan = false;
            } else {
              value = v;
              junkCheck = true;
            }
          }
        }
      }
      if (needScan) {
        // Unquoted scan, appending the characters it keeps onto `value`.
        let start = pos;
        let added = 0;
        let j = pos;
        ended = END_EOF; // default: EOF unless a delimiter is met
        while (j < n) {
          const c = text.charCodeAt(j);
          if (c === COMMA) {
            if (j > start) {
              value += text.slice(start, j);
              added += j - start;
            }
            pos = j + 1;
            ended = END_COMMA;
            break;
          }
          if (c === LF) {
            if (j > start) {
              value += text.slice(start, j);
              added += j - start;
            }
            pos = j + 1;
            line += 1;
            ended = END_BREAK;
            break;
          }
          if (c === CR) {
            if (j + 1 < n && text.charCodeAt(j + 1) === LF) {
              if (j > start) {
                value += text.slice(start, j);
                added += j - start;
              }
              pos = j + 2;
              line += 1;
              ended = END_BREAK;
              break;
            }
            if (j > start) {
              value += text.slice(start, j);
              added += j - start;
            }
            errors.push({ code: 'stray_cr', line: recordLine, row: recordRow });
            j += 1;
            start = j;
            continue;
          }
          j += 1;
        }
        if (ended === END_EOF) {
          // Ran off the end without a delimiter.
          if (j > start) {
            value += text.slice(start, j);
            added += j - start;
          }
          pos = n;
        }
        if (junkCheck && added > 0) errors.push({ code: 'quote_junk', line: recordLine, row: recordRow });
      }
      fields.push(value);
    } while (ended === END_COMMA);

    if (fields.length === 1 && fields[0] === '' && !quoted) continue;

    if (width < 0) width = fields.length;
    if (header && columns === null) {
      columns = fields;
      continue;
    }
    if (fields.length < width) {
      errors.push({ code: 'short_row', line: recordLine, row: recordRow, fields: fields.length });
      while (fields.length < width) fields.push('');
    } else if (fields.length > width) {
      errors.push({ code: 'long_row', line: recordLine, row: recordRow, extra: fields.splice(width) });
    }
    rows.push(fields);
  }
  return { columns: header ? (columns ?? []) : null, rows, errors };
}
