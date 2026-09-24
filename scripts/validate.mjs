#!/usr/bin/env node
// Fixture integrity check.
//
// This validates that the fixture set is INTERNALLY CONSISTENT. It does not
// and must not compute a fingerprint: dtx-format holds no implementation of
// the format, by decision, and importing a consumer's implementation here
// would invert the dependency this repository exists to keep one-way.
//
// Correctness is asserted by each consumer against these fixtures, in that
// consumer's own CI. Integrity is asserted here.

import { readFile, readdir, stat } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []
const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')
const FP_PATTERN = /^fp(\d+):[0-9a-f]{64}$/

const exists = async (p) => {
  try { await stat(join(ROOT, p)); return true } catch { return false }
}

// --- the manifest -----------------------------------------------------------
let manifest
try {
  manifest = JSON.parse(await readFile(join(ROOT, 'fp1/manifest.json'), 'utf8'))
} catch (e) {
  console.error(`fp1/manifest.json is not readable JSON: ${e.message}`)
  process.exit(1)
}

if (manifest.algorithm !== 'fp1') {
  fail(`manifest algorithm is "${manifest.algorithm}", expected "fp1"`)
}
if (!Array.isArray(manifest.fixtures)) {
  console.error('manifest.fixtures must be an array')
  process.exit(1)
}

const seenSlugs = new Set()
const claimedCharts = new Set()
let pendingCount = 0

for (const f of manifest.fixtures) {
  const where = `fixture "${f.slug ?? '(no slug)'}"`

  if (!f.slug) fail(`${where}: missing slug`)
  if (seenSlugs.has(f.slug)) fail(`${where}: duplicate slug`)
  seenSlugs.add(f.slug)

  if (!f.chart) { fail(`${where}: missing chart path`); continue }
  claimedCharts.add(f.chart)

  if (!(await exists(f.chart))) {
    fail(`${where}: chart not found at ${f.chart}`)
    continue
  }

  // The bytes are the fixture. A changed hash means something normalised the
  // file — a .gitattributes regression, an editor, a well-meaning formatter —
  // and that is exactly what this repository must never accept silently.
  const actual = sha256(await readFile(join(ROOT, f.chart)))
  if (!f.sha256) {
    fail(`${where}: no sha256 recorded. Every chart's bytes must be pinned.`)
  } else if (actual !== f.sha256) {
    fail(
      `${where}: chart bytes changed.\n` +
      `    expected ${f.sha256}\n` +
      `    actual   ${actual}\n` +
      `    If this was intentional, update the manifest in the same commit and\n` +
      `    say why in the message. If it was not, something normalised the file.`
    )
  }

  // Absent and null are different answers, and a consumer has to be able to
  // tell them apart: absent means nobody has agreed on a value yet, null means
  // the chart has no fingerprint at all. Conflating them would let a chart with
  // no drum onsets read as work still to do, or the reverse.
  if (!('fp1' in f)) {
    if (!f.pending) {
      fail(`${where}: fp1 is absent with no "pending" note explaining why`)
    }
    pendingCount++
  } else if (f.pending) {
    fail(`${where}: has both an fp1 and a "pending" note; an agreed value is not pending`)
  } else if (f.fp1 !== null && !FP_PATTERN.test(f.fp1)) {
    fail(`${where}: fp1 "${f.fp1}" is not of the form fp<N>:<64 lowercase hex>, or null`)
  } else if (f.fp1 !== null && !f.fp1.startsWith(`${manifest.algorithm}:`)) {
    fail(`${where}: fp1 "${f.fp1}" is not a ${manifest.algorithm} fingerprint`)
  }

  const prov = join(dirname(f.chart), 'PROVENANCE.md')
  if (!(await exists(prov))) {
    fail(`${where}: no PROVENANCE.md beside the chart (${prov}). See NOTICE.`)
  }
}

// --- pairs ------------------------------------------------------------------
// A fixture naming another in "sameAs" is one half of a pair the algorithm must
// not tell apart: a re-save, a relabel, a tempo edit. The consumers assert each
// chart against its own value; this asserts the recorded values agree, so a
// pair cannot be pinned to two different answers by a careless edit. Nothing
// is computed here.
const bySlug = new Map(manifest.fixtures.map((f) => [f.slug, f]))
for (const f of manifest.fixtures) {
  if (f.sameAs === undefined) continue
  const where = `fixture "${f.slug}"`
  const other = bySlug.get(f.sameAs)
  if (!other) {
    fail(`${where}: sameAs names "${f.sameAs}", which is not a fixture`)
  } else if (other === f) {
    fail(`${where}: sameAs names itself`)
  } else if (!('fp1' in f) || !('fp1' in other)) {
    fail(`${where}: sameAs "${f.sameAs}" but one of the pair is still pending`)
  } else if (f.fp1 !== other.fp1) {
    fail(
      `${where}: sameAs "${f.sameAs}" but the recorded values differ.\n` +
      `    ${f.slug}: ${f.fp1}\n` +
      `    ${other.slug}: ${other.fp1}`
    )
  }
}

// --- the other direction ----------------------------------------------------
// A chart on disk with no manifest entry is as much a defect as a manifest
// entry with no chart. dtxmania-poly's corpus enforces both directions and so
// does this.
const chartsDir = join(ROOT, 'charts')
for (const entry of await readdir(chartsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const files = await readdir(join(chartsDir, entry.name))
  const charts = files.filter((f) => f !== 'PROVENANCE.md' && !f.startsWith('.'))
  if (charts.length === 0) {
    fail(`charts/${entry.name}/ holds no chart file`)
    continue
  }
  for (const c of charts) {
    const rel = `charts/${entry.name}/${c}`
    if (!claimedCharts.has(rel)) {
      fail(`${rel} exists on disk but no manifest entry references it`)
    }
  }
}

// --- report -----------------------------------------------------------------
if (pendingCount > 0) {
  warn(`${pendingCount} fixture(s) awaiting a fingerprint two implementations agree on`)
}
for (const w of warnings) console.log(`warning: ${w}`)

if (errors.length > 0) {
  console.error(`\n${errors.length} problem(s):\n`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const n = manifest.fixtures.length
console.log(`ok — ${n} fixture(s) validated, ${n - pendingCount} with an agreed value`)
