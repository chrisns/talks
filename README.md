# Talks that I have delivered

The code behind https://talks.cns.me

## [Current schedule](./schedule.md)

## Continuous secret hiding

The `server:git-secret` script runs `git secret hide` in a loop so that any updated secret files are re-encrypted while the development server is running. This ensures sensitive content never leaks into the generated output.
