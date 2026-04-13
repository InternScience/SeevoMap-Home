# SeevoMap Agent Notes

This file records the repo-specific workflow that future Codex sessions should
pick up immediately.

## Local-first workflow

- Always test locally before talking about deployment.
- For content or UI changes, run `npm run build` at minimum.
- Use `npm run dev` when you need to inspect the page interactively before
  pushing.
- For any frontend change under `src/`, restart or rerun the local dev server so
  the user can immediately verify the result in the browser.
- Prefer the fixed-port command `npm run dev:local`, which serves the app on
  port `3456` with `--host 0.0.0.0`.
- After making frontend changes, tell the user that the local preview should be
  refreshed on the same port instead of waiting for GitHub deployment.

## Branches and Pages deployment

- `main` is the production branch.
- Pushing `main` triggers [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)
  and deploys the production GitHub Pages site.
- `docs-autoresearch-preview` remains the preview branch name, but its Pages
  workflow is currently manual-only.
- [`.github/workflows/preview-pages.yml`](./.github/workflows/preview-pages.yml)
  can still publish a preview build under the Pages preview subpath while
  keeping the root site aligned with `main`, but someone must trigger it
  explicitly from the Actions UI.

## Practical rule

- The normal order is: edit locally -> test locally -> if a preview is needed,
  trigger the preview workflow manually -> review -> merge or port to `main` ->
  let GitHub Pages deploy production.
- Uncommitted local changes are not deployed.
- A commit sitting only on `docs-autoresearch-preview` is not the same thing as
  production deployment.
