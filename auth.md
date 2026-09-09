# Auth.md - Authentication & Access Instructions for AI Agents

> Agent registration metadata for cv.uray.dev.
> Public read-only. No accounts. Credentials are optional and only attribute correspondence.
> Operator contact: <mailto:me@uray.dev>.

## Agent registration

cv.uray.dev publishes public read-only portfolio, curriculum vitae, and engineering documentation for AI agents.
No endpoint requires a credential and there are no user accounts.
The only credential this domain issues is an optional api_key, provided out-of-band on request; it attributes correspondence and grants no additional access.
This document describes agent access, identity declaration, and contact pathways.

Both roles live on one host. The resource server is https://cv.uray.dev and the authorization server is https://cv.uray.dev.

## Discovery

Read these two documents in this order:
- Fetch https://cv.uray.dev/.well-known/oauth-protected-resource and read resource, resource_name, authorization_servers, scopes_supported, and bearer_methods_supported.
- Fetch https://cv.uray.dev/.well-known/oauth-authorization-server and read the agent_auth block: skill, register_uri, claim_uri, revocation_uri, identity_types_supported, and identity_assertion.assertion_types_supported.

Nothing on this domain answers 401. The protected resource metadata is published so an OAuth-aware agent can find the identity surface without guessing. Every declared resource answers an anonymous request.

## Scopes

- `read:profile`: Public biography, summary, and contact information.
- `read:projects`: Public engineering portfolio and technical specifications.
- `read:memoir`: Full technical engineering memoir and background history.

## Identity

- Operator: Uray Meiviar
- Domain: cv.uray.dev
- Contact: <mailto:me@uray.dev>
- Public Profile: https://uray.dev
- Technical Index: [/llms.txt](https://cv.uray.dev/llms.txt)
- Full Technical Memoir: [/data/profile/DESC.txt](https://cv.uray.dev/data/profile/DESC.txt)
- API Catalog: [/.well-known/api-catalog](https://cv.uray.dev/.well-known/api-catalog)
- Sitemap: [/sitemap.xml](https://cv.uray.dev/sitemap.xml)

## Supported identity types

- `anonymous`: No registration required; every resource is public read-only.
- `identity_assertion`: Registered agent operator identity, backed by a verified email.

## Registration

Registration is not required to access any content on cv.uray.dev.
To register an agent operator identity for attribution or audit correspondence, email <mailto:me@uray.dev?subject=Agent%20Registration> with:
- Agent identifier and operator name
- Purpose of access
- Contact email

## Claim

To claim an existing agent identifier or verify domain control, contact <mailto:me@uray.dev?subject=Agent%20Claim>.

## Revocation

To revoke correspondence or request deletion of correspondence logs, email <mailto:me@uray.dev?subject=Agent%20Revocation>.

