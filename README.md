# Fast CSV Reader

A faster drop-in for make.fun's own csv-reader 1.0.0, built for the
[Read broken CSV files faster](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
bounty ($100 in USDC).

`run(input)` returns exactly csv-reader's answer for every input — the same
`{columns, rows, errors}` for every broken row it meets — but reads the text
in a single pass: unquoted fields are sliced between delimiters, quoted
fields jump to the closing quote, and nothing is built a character at a time.

## Run it

```sh
MAKEFUN_INPUT_DIR=./input MAKEFUN_OUTPUT_DIR=./output node main.ts
```

`main.ts` reads every case from `/input/cases.json`, answers each with `run`,
and writes `/output/answers.json`.

## make.fun

[![make.fun](https://make.fun/badge/csv-reader-speed-01-run-20261121.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![Rank](https://make.fun/badge/csv-reader-speed-01-run-20261121/HendrikSutisna/csv-reader-speed-01/rank.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)
[![Reward](https://make.fun/badge/csv-reader-speed-01-run-20261121/HendrikSutisna/csv-reader-speed-01/reward.svg)](https://make.fun/bounty/csv-reader-speed-01-run-20261121)

Entry for the [make.fun bounty "Read broken CSV files faster"](https://make.fun/bounty/csv-reader-speed-01-run-20261121).
