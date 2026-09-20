# fp1 fixtures

`manifest.json` maps each chart to the fingerprint `fp1` must produce for it.

## What fp1 is

A version-tagged fingerprint of **where player-struck drum onsets land**,
normalised so a chart stays identifiable through the usual ways a copy gets
disguised. Sample swaps, WAV relabelling and subdivision re-saves do not change
it; neither does a BPM-tag edit, because positions are measure-relative.

The reference implementation is ghostnote's
`packages/crawler/parse/derive-note-fingerprint.ts`. The serialization it
produces — not just the algorithm's description — is the compatibility surface,
and `dtxmania-poly` issue #104 carries it written out in full.

## The manifest

```jsonc
{
  "algorithm": "fp1",
  "fixtures": [
    {
      "slug": "some-chart",
      "chart": "charts/some-chart/song.dtx",
      "sha256": "<sha256 of the chart file's exact bytes>",
      "fp1": "fp1:<64 lowercase hex>",   // or null, with "pending"
      "expect": "prose describing what this fixture exercises"
    }
  ]
}
```

`sha256` pins the chart's bytes so a normalisation is caught (see the root
README). `fp1` may be `null` while no implementation exists yet, but only with
a `pending` note saying what it waits on.

## Where a fingerprint value comes from

**Not from this repository** — nothing here computes one. A value is written
down once two independent implementations produce it and agree. Until then it
stays `null`.

That ordering is the whole point: a fixture whose expected value came from one
implementation only pins that implementation's bugs.

## Versions

Fingerprints are comparable **only within a version**. `fp1` and `fp2` run
different algorithms and produce unrelated hashes for the same chart, so every
consumer stores and filters on the `fp<N>:` prefix.

An algorithm change is a coordinated bump across every implementation, never a
one-sided edit — and it lands here as a new manifest, not as edits to this one.
