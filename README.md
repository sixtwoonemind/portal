# Portal

Centralized authentication and service gateway for SixTwoOne Mind.

## Purpose

Single sign-on entry point for all 621 services:
- `https://sixtwoonemind.com/login` - Authentication with passkeys
- `https://sixtwoonemind.com/dashboard` - Service selector
- Cross-subdomain authentication for `*.sixtwoonemind.com`

## Services

- **Ax** (`https://ax.sixtwoonemind.com`) - Personal AI assistant
- Future services accessible from dashboard

## Architecture

- **Frontend**: Modula design system with relational colors and gravitational spacing
- **Authentication**: WebAuthn/Passkey with Supabase credential storage
- **Session Management**: Cross-subdomain cookies (`.sixtwoonemind.com`)
- **Deployment**: Cloudflare Pages

## Development

Standard HTML/CSS/JavaScript with Modula principles:
- Relational color systems from logo grid [1-9]
- Gravitational spacing (alignment over arbitrary scales)
- Design judgment for visual impact
