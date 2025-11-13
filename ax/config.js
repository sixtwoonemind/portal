/**
 * Ax Configuration
 * Windmill asynchronous webhook endpoints with polling
 *
 * Uses api.sixtwoonemind.com which has CORS headers configured in Caddy
 * Tokens stored in 1Password are passed as Bearer tokens in Authorization header
 * Pattern: POST to /jobs/run/ → get UUID → poll /jobs_u/completed/get_result_maybe/
 */

const API_BASE = 'https://api.sixtwoonemind.com';

export const WEBHOOKS = {
    chat: {
        triggerUrl: `${API_BASE}/api/w/sixtwoonemind/jobs/run/f/f/ax/chat`,
        token: 'hrmAptCbl9bh3Mg0KJGNXwDirFF0mSKm',
        flow: 'f/ax/chat'
    },
    listConversations: {
        triggerUrl: `${API_BASE}/api/w/sixtwoonemind/jobs/run/f/f/ax/list_conversations_api`,
        token: 'lnb8myQmPwydPrhsPqBNPR5ix7rni4In',
        flow: 'f/ax/list_conversations_api'
    },
    getConversationItems: {
        triggerUrl: `${API_BASE}/api/w/sixtwoonemind/jobs/run/f/f/ax/get_conversation_items_api`,
        token: 'u1j9dA6Tx5ARvNGhmeOk0DOvaJEb9r6y',
        flow: 'f/ax/get_conversation_items_api'
    }
};

// Helper function to trigger job and wait for completion
export async function runJob(webhookConfig, body) {
    // Trigger job
    const triggerResponse = await fetch(webhookConfig.triggerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${webhookConfig.token}`
        },
        body: JSON.stringify(body)
    });

    if (!triggerResponse.ok) {
        throw new Error(`Failed to trigger job: ${triggerResponse.status}`);
    }

    const uuid = await triggerResponse.text();

    // Poll for completion
    const resultUrl = `${API_BASE}/api/w/sixtwoonemind/jobs_u/completed/get_result_maybe/${uuid}`;

    while (true) {
        const resultResponse = await fetch(resultUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${webhookConfig.token}`
            }
        });

        if (!resultResponse.ok) {
            throw new Error(`Failed to check job status: ${resultResponse.status}`);
        }

        const data = await resultResponse.json();

        if (data.completed) {
            return data.result;
        }

        // Wait 1 second before polling again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}
