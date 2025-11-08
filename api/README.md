# Portal API Endpoints

Backend implementation for SixTwoOne Mind portal authentication.

## Endpoints

### Passkey Registration
- `POST /auth/passkey/register/options` - Get WebAuthn registration options
- `POST /auth/passkey/register/verify` - Verify and store new passkey credential

### Passkey Authentication
- `POST /auth/passkey/authenticate/options` - Get WebAuthn authentication options
- `POST /auth/passkey/authenticate/verify` - Verify passkey assertion and create session

### Session Management
- `POST /auth/signout` - Invalidate current session

## Implementation

These endpoints will be implemented as Windmill flows in the `f/portal/auth` namespace:
- `f/portal/auth/passkey_register_options`
- `f/portal/auth/passkey_register_verify`
- `f/portal/auth/passkey_authenticate_options`
- `f/portal/auth/passkey_authenticate_verify`
- `f/portal/auth/signout`

## Database

Uses Supabase (ax-pv1 project: `idepddaqucsdrnsjctke.supabase.co`) with tables:
- `users` - User accounts
- `passkey_credentials` - WebAuthn credentials
- `auth_sessions` - Active sessions
- `webauthn_challenges` - Temporary challenge storage
