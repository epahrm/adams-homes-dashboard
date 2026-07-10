# Working on the Dylan the Acorn site

Workflow rule (from the site owner): batch changes — do NOT commit/push after
every edit. Iterate locally (render/screenshot the page with a local static
server so absolute /dylan-the-acorn/ paths resolve), collect feedback into an
agreed change list, then land the whole batch as a single commit + push.
Each push triggers a Vercel production deployment, so pushes should be rare
and deliberate.
