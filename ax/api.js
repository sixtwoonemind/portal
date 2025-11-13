/**
 * Ax API Client
 * Handles communication with Windmill (viento.dev.sixtwoone.net)
 * Implements the standardized API contract
 */

import { getSession, getConversationId, setConversationId } from './auth.js';

const API_BASE_URL = 'https://viento.dev.sixtwoone.net';

/**
 * API Response structure (from contract)
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {string} timestamp
 * @property {Object|null} data
 * @property {Object|null} error
 * @property {Object|null} meta
 */

/**
 * Chat with Ax
 * @param {string} message - User message
 * @param {string} conversationId - OpenAI conversation ID or 'new'
 * @returns {Promise<Object>} - { response, conversationId, usage }
 * @throws {Error} - On API error or network failure
 */
export async function chat(message, conversationId = 'new') {
    const session = getSession();
    if (!session) {
        throw new Error('No active session');
    }

    if (!message || message.trim() === '') {
        throw new Error('Message cannot be empty');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/w/sixtwoonemind/jobs/run_wait_result/f/ax/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.session_token}`
            },
            body: JSON.stringify({
                message: message.trim(),
                conversation_id: conversationId,
                user_id: session.email
            })
        });

        // Parse JSON response
        const result = await response.json();

        // Check API contract success field
        if (!result.success) {
            const error = result.error || {};
            throw new Error(error.message || 'API request failed');
        }

        // Extract data
        const data = result.data || {};

        // Store conversation ID for future messages
        if (data.conversation_id) {
            setConversationId(data.conversation_id);
        }

        return {
            response: data.response || '',
            conversationId: data.conversation_id || conversationId,
            messageId: data.message_id || null,
            usage: result.meta?.usage || null,
            requestId: result.meta?.request_id || null
        };
    } catch (error) {
        // Network error or JSON parse error
        if (error instanceof TypeError) {
            throw new Error('Network error - please check your connection');
        }
        throw error;
    }
}

/**
 * Health check endpoint (if available)
 * @returns {Promise<boolean>}
 */
export async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}
