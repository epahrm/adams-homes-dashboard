# Land Acq Pro — demo assets

Reproducible sources for the team demo deliverables.

- **`capture-demo.mjs`** — drives Chromium (Playwright) through the seller flow and
  admin workspace, recording a `.webm` walkthrough with on-screen captions and
  capturing clean, element-scoped screenshots of each section.
- **`build-guide.mjs`** — stitches those screenshots + written feature notes into
  the shareable **`../platform-guide.html`** page.

## Regenerate

```bash
# from a checkout, with playwright + pdf tooling available
node docs/land-acq-pro/demo/capture-demo.mjs   # -> demo-out/land-acq-pro-demo.webm + shots
node docs/land-acq-pro/demo/build-guide.mjs     # -> platform-guide.html
```

> The output paths in these scripts point at the session scratchpad; adjust
> `OUT` / `DIR` to a local folder when running elsewhere. The scripts load the
> pages via `file://` and rely on the admin seed data, so no server is needed.

## Delivered artifacts

- **Shareable guide** — published as a private Claude Artifact (section-by-section,
  with screenshots). A static copy lives at `../platform-guide.html`.
- **Walkthrough video** — `land-acq-pro-demo.webm` (delivered to Elizabeth; not
  committed to keep the repo light — regenerate with `capture-demo.mjs`).
