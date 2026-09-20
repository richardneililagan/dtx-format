#!/usr/bin/env bash
# Cut a release: tag, archive, checksum, publish.
#
# Consumers pin a tag and verify the checksum — see decision 0014 in
# dtxmania-poly. They do not track this repository's default branch, so a
# fixture change reaches a consumer only when that consumer bumps its pin.
#
#   ./scripts/release.sh v0.1.0

set -euo pipefail

VERSION="${1:-}"
if [[ -z "$VERSION" ]]; then
  echo "usage: $0 <version>   e.g. $0 v0.1.0" >&2
  exit 64
fi
if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "error: version must look like v1.2.3, got '$VERSION'" >&2
  exit 64
fi

cd "$(dirname "$0")/.."

if [[ -n "$(git status --porcelain)" ]]; then
  echo "error: working tree is dirty. Commit or stash first." >&2
  exit 1
fi

echo "==> validating fixtures before tagging"
node scripts/validate.mjs

ARCHIVE="dtx-format-${VERSION}.tar.gz"

echo "==> tagging $VERSION"
git tag -a "$VERSION" -m "dtx-format $VERSION"

# git archive from the tag, not the working tree: the artifact is reproducible
# from the tag alone, and carries no untracked or ignored files.
echo "==> building $ARCHIVE"
git archive --format=tar.gz --prefix="dtx-format-${VERSION}/" -o "$ARCHIVE" "$VERSION"

sha256sum "$ARCHIVE" > "${ARCHIVE}.sha256"
echo "==> $(cat "${ARCHIVE}.sha256")"

echo "==> pushing tag"
git push origin "$VERSION"

echo "==> creating release"
gh release create "$VERSION" \
  "$ARCHIVE" "${ARCHIVE}.sha256" \
  --title "dtx-format $VERSION" \
  --notes "Fixture set $VERSION.

Consumers pin this tag and verify the checksum:

\`\`\`
$(cat "${ARCHIVE}.sha256")
\`\`\`
"

echo
echo "Done. Consumers bump their pin to $VERSION and update the recorded checksum."
