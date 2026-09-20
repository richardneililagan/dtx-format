# placeholder-minimal

**Origin:** authored for this repository. Not a third-party work.
**Licence:** MIT, as with the rest of the repository.

## Why it is here

A deliberately tiny, plain-ASCII chart so the fixture harness has something
real to validate before the conformance corpus arrives. It exists to prove the
pipeline works, not to test any parser behaviour worth having an opinion about.

Four bass-drum onsets on channel 13, evenly spaced across one measure — which
under `fp1` reduce to the fractions 0/1, 1/4, 1/2, 3/4.

## What it deliberately does NOT cover

Encoding and line-ending diversity. This chart is plain ASCII with LF endings,
which is the *least* interesting case. The charts that matter — Shift-JIS,
UTF-16LE, and the one whose bytes are valid Shift-JIS nowhere — arrive with the
corpus (see `charts/README.md`). Do not read this file as a template for what a
good fixture looks like.
