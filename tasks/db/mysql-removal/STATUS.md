# MySQL Legacy Cleanup – Status

Dato: 4. november 2025  
Owner: Platform/Backend  
Status: [ ] Not started – Repo indeholder stadig MySQL artefakter (compose, docs, snapshots).

## TODO

- [ ] Fjerne/arkivere MySQL services i `docker-compose*.yml` og opdatere ops-dokumentation.
- [ ] Rense dokumentation/rapporter så Supabase er den eneste beskrevne database.
- [ ] Regenerere Drizzle snapshots + opdatere scripts (`test-migration.ps1`, `.cursorrules` osv.).
- [ ] Opdatere lockfile så `mysql2` dependency fjernes.
- [ ] Endelig verifikation (`rg "mysql"` kun i legacy appendix).
