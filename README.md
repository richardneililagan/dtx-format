# dtx-format

The DTX format family — its specification, a conformance corpus, and the
cross-language fixtures that keep independent implementations honest.

Three projects read charts in this family and each implements it natively:

| Project | Language | Role |
|---|---|---|
| [dtxmania-poly](https://github.com/richardneililagan/dtxmania-poly) | C# | the game — parses to play |
| dtxcreator-poly | Rust + web (Tauri) | the editor — parses to round-trip |
| ghostnote | TypeScript | the catalog — parses to identify |

## This repository holds data, not code

There is no library here to link against, and that is deliberate rather than
unfinished. Across C#, Rust and TypeScript the only thing three implementations
can genuinely share is a specification and a set of fixtures — anything else
means a native core that all three bind to, which is a much larger commitment
than the problem warrants.

The reasoning, the alternatives and the conditions for revisiting it are in
[decision 0014](https://github.com/richardneililagan/dtxmania-poly/blob/main/docs/decisions/0014-repository-topology.md)
in `dtxmania-poly`.

Two consequences worth stating plainly:

- **The format is implemented more than once, on purpose.** That is not
  duplication awaiting cleanup.
- **These fixtures are the only thing standing between those implementations
  and silent divergence.** Divergence here produces no error message — a chart
  simply stops matching its catalog entry. The fixtures are load-bearing.

## Correctness is asserted by consumers, integrity is asserted here

`scripts/validate.mjs`, run by CI, checks that the fixture set is internally
consistent: every chart referenced exists, every chart on disk is referenced,
every chart's bytes match its recorded SHA-256, every fingerprint is
well-formed, and every chart has provenance.

**It never computes a fingerprint.** Doing so would mean importing a
consumer's implementation, which inverts the dependency this repository exists
to keep one-way. Whether an implementation is *correct* is asserted in that
implementation's own CI, against these fixtures.

## Layout

```
charts/<slug>/           chart file + PROVENANCE.md — the shared chart set
fp1/manifest.json        expected fp1 fingerprint per chart
parse/<slug>.txt         golden parse snapshots (arrives with the corpus)
spec/                    the format specification
scripts/                 validate.mjs, release.sh
```

`charts/` is one chart set with several derived artifacts beside it, rather
than a chart set per artifact. When `dtxmania-poly`'s parser corpus moves here,
it maps mechanically:

| from `dtxmania-poly` | to here |
|---|---|
| `corpus/charts/<slug>/` | `charts/<slug>/` |
| `corpus/golden/<slug>.txt` | `parse/<slug>.txt` |

That move is why nothing in `corpus/` is allowed to depend on `dtxmania-poly`'s
layout, and why nothing here may depend on a consumer's.

## The charts are the fixture, bytes and all

The corpus deliberately holds Shift-JIS, UTF-16LE and LF-only charts, and at
least one whose bytes are valid Shift-JIS nowhere. **Normalising any of that
silently rewrites the thing under test**, and the rewrite is invisible in
review because the rendered diff looks identical.

Three things guard against it, and all three are load-bearing:

1. `.gitattributes` marks `charts/**` and `parse/**` as `-text`, disabling
   every conversion git would otherwise apply.
2. `.editorconfig` sets every normalising property to `unset` under those
   paths.
3. `scripts/validate.mjs` pins each chart's SHA-256, so if 1 or 2 is ever
   removed or bypassed, CI fails loudly instead of accepting rewritten bytes.

Never "fix" a chart's encoding or line endings. Never regenerate a manifest
hash to make a red build green without reading why it went red.

## Adding a fixture

1. `charts/<slug>/` — the chart, plus a `PROVENANCE.md` saying where it came
   from and why it is here. A chart without provenance fails validation.
2. Add an entry to `fp1/manifest.json` with the chart path and its SHA-256.
3. Set `fp1` to the fingerprint once two implementations agree on it — `null`
   if they agree the chart has none — or leave `fp1` out and add a `pending`
   note saying what it is waiting for. A release must have nothing pending.
4. `node scripts/validate.mjs`

Pick fixtures for **coverage of the algorithm**, not for songs you like.

## Releases

Consumers pin a tag and verify a checksum; they do not track `main`.

```sh
./scripts/release.sh v0.1.0
```

That validates, tags, builds a reproducible `git archive` from the tag,
checksums it and publishes a GitHub release. A fixture change reaches a
consumer only when that consumer bumps its pin — which is the intended
friction, not an oversight.

## Licence

MIT (see [LICENSE](LICENSE)) for everything authored here.

Third-party chart fixtures are **not** covered by it and retain their original
authors' rights — see [NOTICE](NOTICE).
