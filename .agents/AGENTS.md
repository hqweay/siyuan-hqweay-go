## Agent skills

### Issue tracker

GitHub issues (private-orca-plus). External PRs are not treated as triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Uses existing `.agent/rules/` and `docs/` for domain context. See `docs/agents/domain.md`.

### i18n enforcement

All user-visible strings in plugin `.tsx`/`.ts` files MUST go through `plugin.t("key")`.
Hardcoded Chinese characters (or any non-ASCII user-facing text) in JSX or logic files are forbidden.
Translations belong in `src/translations/parts/[plugin-name].ts` with keys prefixed by plugin name.
Before finalising any sub-plugin, run:
```bash
grep -rn '[^\x00-\x7F]' src/lets-[plugin]/ --include="*.tsx" --include="*.ts"
```
This must return zero matches in all files except the translation file itself.
