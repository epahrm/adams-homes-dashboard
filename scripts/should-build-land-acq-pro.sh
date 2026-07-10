#!/bin/bash
# This script is used as the "Ignored Build Step" in Vercel for palm-bay-scattered-lots-07092026.
# It ensures the Land Acq Pro project ALWAYS builds, regardless of what files changed.
# Usage in Vercel Settings → Git → Ignored Build Step: bash scripts/should-build-land-acq-pro.sh
exit 1  # Always build (exit code 1 = proceed, exit code 0 = skip)
