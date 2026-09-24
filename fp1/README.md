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
      "fp1": "fp1:<64 lowercase hex>",   // or null: the chart has no fingerprint
      "sameAs": "other-slug",            // optional: must fingerprint like that one
      "expect": "prose describing what this fixture exercises"
    }
  ]
}
```

`sha256` pins the chart's bytes so a normalisation is caught (see the root
README).

**`null` and absent are different answers.** `"fp1": null` is an agreed
result: the chart has no player-struck drum onsets, so it has no fingerprint at
all — not an empty string, not a sentinel. A consumer asserts that its
implementation returns *nothing* for it. An entry with no `fp1` key at all is
one nobody has agreed on yet, and must carry a `pending` note saying what it
waits on. Consumers fail on any pending entry, so one never ships in a release.

`sameAs` marks one half of a pair the algorithm must not tell apart — a grid
re-save, a sample relabel, a tempo edit. The validator checks the two recorded
values are equal; each consumer computes both charts and checks it gets the same
answer twice.

## What the fixtures cover

Chosen for the algorithm, not for the music:

| Fixture | Exercises |
|---|---|
| `fp1-plain` | the ordinary case, with a BGM line that must not count |
| `fp1-layered` | several lines on one lane in one measure, overlaid |
| `fp1-subdivision-coarse` / `-fine` | a re-save on finer grids does not move it |
| `fp1-relabel-original` / `-swapped` | relabelling samples does not move it |
| `fp1-bpm-slow` / `-fast` | a BPM-tag-only edit does not move it |
| `fp1-sparse` | gaps between measures, numeric measure order, an all-`00` line |
| `fp1-lanes-1a-1c` | channels `1A`, `1B`, `1C`, lower case, canonical lane order |
| `fp1-no-onsets` | no drum onsets, so no fingerprint (`null`) |
| `fp1-tuplets` | K of 5, 7, 11 and 47, off every power-of-two grid |
| `fp1-utf16le-bom` | UTF-16LE decoding |
| `fp1-shift-jis-lead-bytes` | Shift-JIS lead bytes with no trail byte |
| `fp1-utf8-unicode-space` | which Unicode spaces count as white space |

The last three are where implementations in different languages are likeliest to
part company: decoders and white-space definitions differ between runtimes, and
the reference's behaviour is what has to be matched.

## Where a fingerprint value comes from

**Not from this repository** — nothing here computes one. A value is written
down once two independent implementations produce it and agree. Until then the
entry has no `fp1` and carries a `pending` note.

That ordering is the whole point: a fixture whose expected value came from one
implementation only pins that implementation's bugs.

## Versions

Fingerprints are comparable **only within a version**. `fp1` and `fp2` run
different algorithms and produce unrelated hashes for the same chart, so every
consumer stores and filters on the `fp<N>:` prefix.

An algorithm change is a coordinated bump across every implementation, never a
one-sided edit — and it lands here as a new manifest, not as edits to this one.
