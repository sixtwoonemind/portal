# Portal Auth API Contract Migration Plan

## Overview

Migrate portal authentication system from direct Windmill webhooks to standardized API contract matching `/minds/ax/chat` architecture.

**Goal**: Consistent API response format across all SixTwoOne Mind services.

---

## Current Architecture

```
Frontend (portal/auth.js)
  ↓ Direct webhook calls
Windmill Scripts (f/portal_auth/*)
  ↓ Custom response formats
Supabase (ax-pv1)
```

**Endpoints (current)**:
- `/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/passkey_register_options`
- `/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/passkey_register_verify`
- `/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/passkey_authenticate_options`
- `/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/passkey_authenticate_verify`
- `/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/signout`

---

## Target Architecture

```
Frontend (portal/auth.js)
  ↓ API contract calls
Caddy (api.sixtwoonemind.com/auth/*)
  ↓
Windmill Flows (f/portal_auth/*)
  ├─ Existing scripts
  └─ format_response (new, enforces API contract)
  ↓
Supabase (ax-pv1)
```

**Endpoints (target)**:
- `POST /auth/passkey/register/options`
- `POST /auth/passkey/register/verify`
- `POST /auth/passkey/authenticate/options`
- `POST /auth/passkey/authenticate/verify`
- `POST /auth/signout`

---

## Implementation Steps

### Phase 1: Create Response Formatters

**Script**: `f/portal_auth/format_auth_response`

```typescript
import { formatApiResponse } from "f/core/format_api_response"

type AuthResponse = {
  success: boolean
  data?: any
  error?: {
    code: string
    message: string
    details?: any
  }
}

export async function main(
  script_response: AuthResponse,
  endpoint: string // e.g., "register_options", "register_verify"
) {
  return formatApiResponse({
    success: script_response.success,
    data: script_response.data || null,
    error: script_response.error || null,
    service: "portal_auth",
    version: "v1",
    endpoint: endpoint
  })
}
```

**Error Code Mapping** (enhance `f/core/determine_error_code`):
```typescript
// Add to existing error code mapper
const AUTH_ERROR_CODES = {
  "credential verification failed": "INVALID_CREDENTIALS",
  "email already registered": "USER_EXISTS",
  "user not found": "USER_NOT_FOUND",
  "challenge expired": "CHALLENGE_EXPIRED",
  "challenge not found": "CHALLENGE_NOT_FOUND",
  "session invalid": "SESSION_INVALID",
  "session expired": "SESSION_EXPIRED",
  "webauthn error": "WEBAUTHN_ERROR"
}
```

### Phase 2: Create Windmill Flows

Create 5 flows wrapping existing scripts:

#### Flow: `f/portal_auth/register_options_flow`
```
a: validate_fields (email, name)
  ↓
b: call_passkey_register_options (existing script)
  ↓
c: format_auth_response
  ↓
Return: API contract response
```

#### Flow: `f/portal_auth/register_verify_flow`
```
a: validate_fields (email, credential)
  ↓
b: call_passkey_register_verify (existing script)
  ↓
c: format_auth_response
  ↓
Return: API contract response
```

#### Flow: `f/portal_auth/authenticate_options_flow`
```
a: call_passkey_authenticate_options (existing script)
  ↓
b: format_auth_response
  ↓
Return: API contract response
```

#### Flow: `f/portal_auth/authenticate_verify_flow`
```
a: validate_fields (credential)
  ↓
b: call_passkey_authenticate_verify (existing script)
  ↓
c: format_auth_response
  ↓
Return: API contract response
```

#### Flow: `f/portal_auth/signout_flow`
```
a: validate_fields (session_token)
  ↓
b: call_signout (existing script)
  ↓
c: format_auth_response
  ↓
Return: API contract response
```

### Phase 3: Update Caddy Routing

**File**: `/srv/infra/xochiquetzal/caddy/Caddyfile`

Add auth routes:

```caddyfile
# Portal Authentication API
api.sixtwoonemind.com {
    # ... existing routes ...

    # Auth endpoints
    handle_path /auth/passkey/register/options {
        reverse_proxy https://viento.dev.sixtwoone.net {
            header_up Host {upstream_hostport}
            rewrite * /api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/register_options_flow?token={$WMILL_TOKEN_PORTAL_AUTH_REGISTER_OPTIONS}
        }
    }

    handle_path /auth/passkey/register/verify {
        reverse_proxy https://viento.dev.sixtwoone.net {
            header_up Host {upstream_hostport}
            rewrite * /api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/register_verify_flow?token={$WMILL_TOKEN_PORTAL_AUTH_REGISTER_VERIFY}
        }
    }

    handle_path /auth/passkey/authenticate/options {
        reverse_proxy https://viento.dev.sixtwoone.net {
            header_up Host {upstream_hostport}
            rewrite * /api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/authenticate_options_flow?token={$WMILL_TOKEN_PORTAL_AUTH_AUTHENTICATE_OPTIONS}
        }
    }

    handle_path /auth/passkey/authenticate/verify {
        reverse_proxy https://viento.dev.sixtwoone.net {
            header_up Host {upstream_hostport}
            rewrite * /api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/authenticate_verify_flow?token={$WMILL_TOKEN_PORTAL_AUTH_AUTHENTICATE_VERIFY}
        }
    }

    handle_path /auth/signout {
        reverse_proxy https://viento.dev.sixtwoone.net {
            header_up Host {upstream_hostport}
            rewrite * /api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth/signout_flow?token={$WMILL_TOKEN_PORTAL_AUTH_SIGNOUT}
        }
    }
}
```

### Phase 4: Update Frontend

**File**: `/Users/jorge/Gits/portal/auth.js`

Update API calls:

```javascript
// Update base URL
const API_BASE_URL = 'https://api.sixtwoonemind.com/auth';

// Remove webhook tokens (handled by Cloudflare Access)
// const WEBHOOK_TOKENS = { ... }; // DELETE

// Update registerPasskey function
export async function registerPasskey(email, name) {
    try {
        // Step 1: Get registration options
        const optionsResponse = await fetch(`${API_BASE_URL}/passkey/register/options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name })
        });

        const optionsResult = await optionsResponse.json();
        if (!optionsResult.success) {
            throw new Error(optionsResult.error?.message || 'Registration options failed');
        }

        const options = optionsResult.data;

        // Step 2: Create credential (unchanged)
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: base64URLToBuffer(options.challenge),
                rp: options.rp,
                user: {
                    id: base64URLToBuffer(options.user.id),
                    name: options.user.name,
                    displayName: options.user.displayName
                },
                pubKeyCredParams: options.pubKeyCredParams,
                timeout: options.timeout,
                attestation: options.attestation,
                authenticatorSelection: options.authenticatorSelection
            }
        });

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        // Step 3: Verify credential
        const verificationResponse = await fetch(`${API_BASE_URL}/passkey/register/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                credential: {
                    id: credential.id,
                    rawId: bufferToBase64URL(credential.rawId),
                    type: credential.type,
                    response: {
                        clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
                        attestationObject: bufferToBase64URL(credential.response.attestationObject)
                    }
                }
            })
        });

        const verificationResult = await verificationResponse.json();
        if (!verificationResult.success) {
            throw new Error(verificationResult.error?.message || 'Credential verification failed');
        }

        // Store session
        const session = verificationResult.data;
        setSession(session);

        return session;
    } catch (error) {
        console.error('Passkey registration error:', error);
        if (error.name === 'NotAllowedError') {
            throw new Error('Registration was cancelled or not allowed');
        }
        throw error;
    }
}

// Update authenticatePasskey function (similar pattern)
// Update signOut function (similar pattern)
```

### Phase 5: Testing Plan

**Test Matrix**:

| Scenario | Expected Result | Validation |
|----------|----------------|------------|
| Register new passkey | Success response with session | Check `success: true`, `data.session_token` exists |
| Register duplicate email | Error response | Check `error.code === "USER_EXISTS"` |
| Authenticate existing passkey | Success response with session | Check `success: true`, `data.session_token` exists |
| Authenticate with wrong credential | Error response | Check `error.code === "INVALID_CREDENTIALS"` |
| Sign out with valid token | Success response | Check `success: true` |
| Sign out with invalid token | Error response | Check `error.code === "SESSION_INVALID"` |
| Request with malformed JSON | Error response | Check `error.code === "INVALID_REQUEST"` |
| Request with missing fields | Error response | Check `error.code === "INVALID_REQUEST"` |

**Test Script**:
```bash
# Test register options
curl -X POST https://api.sixtwoonemind.com/auth/passkey/register/options \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}' | jq

# Verify response structure
# - success: true
# - data: object with challenge, rp, user, etc.
# - meta.request_id: exists
# - meta.service: "portal_auth"
```

### Phase 6: Documentation

**Update Papeles** (`Web Services > Portal Authentication`):
- Update "Backend (Windmill Scripts)" page with flow architecture
- Add "API Contract" section to Architecture Overview
- Update code examples with new endpoint URLs
- Document error codes and handling

**Create new page**: `API Contract Specification` in Portal Authentication chapter
- Mirror structure from Ax API contract
- Document all 5 endpoints
- Include TypeScript interfaces
- Add example usage patterns

---

## Migration Checklist

- [ ] Create `f/portal_auth/format_auth_response` script
- [ ] Update `f/core/determine_error_code` with auth error codes
- [ ] Create 5 Windmill flows (register_options, register_verify, authenticate_options, authenticate_verify, signout)
- [ ] Generate webhook tokens for new flows
- [ ] Update Caddyfile with auth routes
- [ ] Add Windmill tokens to Caddy environment
- [ ] Reload Caddy configuration
- [ ] Update `portal/auth.js` with new API calls
- [ ] Remove webhook tokens from auth.js
- [ ] Test complete registration flow
- [ ] Test complete authentication flow
- [ ] Test sign out flow
- [ ] Test error scenarios
- [ ] Update Papeles documentation
- [ ] Deploy updated portal to Cloudflare Pages
- [ ] Verify production functionality

---

## Rollback Plan

If issues occur:

1. **Caddy**: Comment out new auth routes, reload Caddy
2. **Frontend**: Revert `portal/auth.js` to use direct webhook URLs
3. **Windmill**: Flows can remain (not breaking anything)

Old webhook endpoints remain functional during migration.

---

## Timeline Estimate

- **Phase 1** (Formatters): 30 minutes
- **Phase 2** (Flows): 1 hour
- **Phase 3** (Caddy): 30 minutes
- **Phase 4** (Frontend): 45 minutes
- **Phase 5** (Testing): 1 hour
- **Phase 6** (Documentation): 45 minutes

**Total**: ~4.5 hours

---

## Success Criteria

- [ ] All auth endpoints return API contract format
- [ ] Error codes are consistent and documented
- [ ] Request IDs generated for all auth requests
- [ ] Frontend works seamlessly with new endpoints
- [ ] All test scenarios pass
- [ ] Documentation updated and accurate
- [ ] No regression in auth functionality
