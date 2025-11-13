/**
 * Ax Configuration
 * Windmill synchronous webhook endpoints
 *
 * Uses api.sixtwoonemind.com which has CORS headers configured in Caddy
 * Tokens stored in 1Password are passed as Bearer tokens in Authorization header
 */

const API_BASE = 'https://api.sixtwoonemind.com';

export const WEBHOOKS = {
    chat: {
        url: `${API_BASE}/api/w/sixtwoonemind/jobs/run_wait_result/f/ax/chat`,
        token: 'hrmAptCbl9bh3Mg0KJGNXwDirFF0mSKm',
        flow: 'f/ax/chat'
    },
    listConversations: {
        url: `${API_BASE}/api/w/sixtwoonemind/jobs/run_wait_result/f/ax/list_conversations_api`,
        token: 'lnb8myQmPwydPrhsPqBNPR5ix7rni4In',
        flow: 'f/ax/list_conversations_api'
    },
    getConversationItems: {
        url: `${API_BASE}/api/w/sixtwoonemind/jobs/run_wait_result/f/ax/get_conversation_items_api`,
        token: 'u1j9dA6Tx5ARvNGhmeOk0DOvaJEb9r6y',
        flow: 'f/ax/get_conversation_items_api'
    }
};
