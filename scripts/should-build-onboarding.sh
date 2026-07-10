#!/bin/bash
# This script is used as the "Ignored Build Step" in Vercel for sales-onboarding.
# It skips builds when only Land Acq Pro files changed, and rebuilds for onboarding changes.
# Usage in Vercel Settings → Git → Ignored Build Step: bash scripts/should-build-onboarding.sh

# Get the list of changed files in this commit
changed_files=$(git diff --name-only $VERCEL_GIT_PREVIOUS_SHA $VERCEL_GIT_COMMIT_SHA)

# Check if any onboarding files were changed
if echo "$changed_files" | grep -qE '^(app/(page|dashboard|admin-login)|lib/(?!land-acq)|public/(?!land-acq-pro))'; then
  exit 1  # Rebuild (exit code 1 = proceed)
else
  exit 0  # Skip build (exit code 0 = skip)
fi
