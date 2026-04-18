# iTE Cloud Web

`ite-cloud-web` is the standalone user-facing frontend for iTE.

It talks to `ite-cloud-api` as an external service.

## Responsibilities

- login and sign-up UI
- session management UI
- later billing and usage pages

## Milestone 1

Milestone 1 only covers:

- `/login`
- `/auth/cli`
- `/account/sessions`

## GitHub OAuth

The login screen always shows `Continue with GitHub` during development

To make it work, configure GitHub OAuth in `ite-cloud-api`.
