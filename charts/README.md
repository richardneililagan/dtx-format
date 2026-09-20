# Charts

One directory per chart: the chart file, and a `PROVENANCE.md` recording where
it came from and why it is here. Both are required — `scripts/validate.mjs`
fails on a chart without provenance, and on a chart no manifest references.

**Do not normalise anything in here.** The encoding and the line endings are
the fixture. See the root [README](../README.md) for the three guards that
enforce that and why each one is needed.

## What belongs here

Charts chosen for **format coverage**: the encodings, the format variants
(DTX, BMS, BME, GDA, G2D), and the structural edge cases a parser gets wrong.
`dtxmania-poly`'s corpus README is the model — 21 charts chosen to exercise
quirks, not to be a music library.

## Pending

`placeholder-minimal` is scaffolding, not coverage. The real set arrives when
`dtxmania-poly`'s parser corpus moves here; see the mapping table in the root
README.
