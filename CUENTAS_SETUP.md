# Cuentas Frontend Setup

## Current Status

✅ Database schema created (cuentas_subscriptions table + view)
✅ Backend Windmill business logic scripts deployed (f/cuentas/expenses/)
✅ Generic API formatters created (f/core/format_api_response, f/core/format_api_error)
✅ Flow wrappers created (following Ax architecture pattern)
✅ Frontend HTML created (cuentas.html)
✅ Dashboard integration complete
✅ Webhook tokens generated and configured in frontend
⚠️ **Ready for testing and deployment**

## Backend Architecture

Following the established Ax pattern, Cuentas uses a three-layer architecture:

1. **Business Logic Scripts** (throw errors, return simple data):
   - `f/cuentas/expenses/save_subscription`
   - `f/cuentas/expenses/get_subscriptions`
   - `f/cuentas/expenses/delete_subscription`

2. **Generic Formatters** (reusable across all services):
   - `f/core/format_api_response` - Wraps success data in API envelope
   - `f/core/format_api_error` - Formats errors with standard codes
   - `f/core/format_response` - Adds CORS headers

3. **Flow Orchestrators** (webhook endpoints, error handling):
   - `f/cuentas/expenses/save_subscription_api`
   - `f/cuentas/expenses/get_subscriptions_api`
   - `f/cuentas/expenses/delete_subscription_api`

## Required: Webhook Token Generation

The frontend needs webhook tokens to call the Windmill Flow orchestrators. These must be generated through the Windmill UI.

### Flows Requiring Webhook Tokens

Navigate to: https://viento.dev.sixtwoone.net/flows

1. **f/cuentas/expenses/save_subscription_api**
   - Click flow → Settings → Webhooks
   - Create webhook (synchronous mode)
   - Copy token
   - Label: `cuentas_frontend_save_api`

2. **f/cuentas/expenses/get_subscriptions_api**
   - Click flow → Settings → Webhooks
   - Create webhook (synchronous mode)
   - Copy token
   - Label: `cuentas_frontend_get_api`

3. **f/cuentas/expenses/delete_subscription_api**
   - Click flow → Settings → Webhooks
   - Create webhook (synchronous mode)
   - Copy token
   - Label: `cuentas_frontend_delete_api`

### Frontend Configuration

✅ **Tokens configured!** The webhook tokens have been retrieved from 1Password and configured in [cuentas.html](cuentas.html):

- Save Subscription API: `msJxhisUK2kib9pipikntU8eAyuoV4mU`
- Get Subscriptions API: `JBtioUe1n7YRZQ2s4DS6ji3zGwO3tbwB`
- Delete Subscription API: `RT4fzGFw5EGutOsW0YcJbf1of7SNhPnw`

Tokens are stored in 1Password under:
- `Viento (webhook-save-subscription-api)`
- `Viento (webhook-get-subscriptions-api)`
- `Viento (webhook-delete-subscription-api)`

## Deployment to Cloudflare Pages

✅ Tokens are configured and ready for deployment!

```bash
cd /Users/jorge/Gits/portal

# Test locally first (optional)
python3 -m http.server 8000
# Visit: http://localhost:8000/cuentas.html

# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name=portal
```

After deployment, Cuentas will be accessible at: https://sixtwoonemind.com/cuentas.html

## Frontend Features Implemented

- ✅ Modula design system integration
- ✅ Year selector (2023-2025)
- ✅ Add/edit subscription form with validation
- ✅ Category totals display
- ✅ Subscription list with edit/delete actions
- ✅ Real-time calculations
- ✅ Session-based authentication
- ✅ Theme toggle (light/dark mode)
- ✅ Responsive layout

## API Contract

All Flow orchestrators return responses following the Standard Response Envelope:

```typescript
{
  success: boolean;
  timestamp: string;
  data: object;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  meta: {
    request_id: string;
    service: string;
    version: string;
    usage: null;
  };
}
```

**Documentation**: See Papeles → Developer Guide → API Standards → API Contract Specification for complete details and error codes.

**Architecture Reference**: See Papeles → Developer Guide → Architecture Patterns → Backend Service Architecture for implementation patterns and migration guide.

## Next Steps (Phase 2)

After webhook tokens are configured and frontend is tested:

1. ✅ Test full CRUD operations via UI
2. Build dedicated Cuentas MCP server for Claude Desktop access
3. Add additional expense types (one-time purchases, home office)
4. Implement Etsy revenue tracking (Phase 3)
5. Build invoice generation system (Phase 4)

## Testing Checklist

Before marking frontend complete:

- [ ] Webhook tokens generated and configured
- [ ] Year selector changes load data correctly
- [ ] Add subscription form works
- [ ] Edit subscription loads data into form
- [ ] Delete subscription with confirmation works
- [ ] Category totals calculate correctly
- [ ] Grand total displays properly
- [ ] Error messages show on API failures
- [ ] Success messages clear after 3 seconds
- [ ] Theme toggle persists across page loads
- [ ] Session authentication redirects to login if expired
