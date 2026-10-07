# web

Portfolio + blog (EN/ES) built with Hugo, styled as a drafting-plate tribute (grids, hairlines, text only) to ~2012 channel pages. Dark only.

- `hugo server` — local preview (Hugo extended ≥ 0.123)
- Projects: `content/{en,es}/projects/*.md` · Blog: `content/{en,es}/blog/` (`hugo new --kind blog en/blog/my-post.md`)
- lofisons link: `params.lofisons` in `hugo.toml` (currently the placeholder `#`)
- Deploy: GitHub Actions → Pages (`.github/workflows/pages.yml`). Set Settings → Pages → Source: GitHub Actions.
