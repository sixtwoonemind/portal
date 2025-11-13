/**
 * Ax Configuration
 * Webhook endpoints and tokens for Windmill API
 *
 * Uses api.sixtwoonemind.com which has CORS headers configured in Caddy
 */

const API_BASE = 'https://api.sixtwoonemind.com';

export const WEBHOOKS = {
    chat: {
        url: `${API_BASE}/api/w/sixtwoonemind/webhooks/hrmAptCbl9bh3Mg0KJGNXwDirFF0mSKm`,
        flow: 'f/ax/chat'
    },
    listConversations: {
        url: `${API_BASE}/api/w/sixtwoonemind/webhooks/lnb8myQmPwydPrhsPqBNPR5ix7rni4In`,
        flow: 'f/ax/list_conversations_api'
    },
    getConversationItems: {
        url: `${API_BASE}/api/w/sixtwoonemind/webhooks/u1j9dA6Tx5ARvNGhmeOk0DOvaJEb9r6y`,
        flow: 'f/ax/get_conversation_items_api'
    }
};
