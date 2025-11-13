/**
 * Ax Authentication & Session Management
 * Integrates with Portal authentication system (passkey-based)
 * Shares session across sixtwoonemind.com subdomains
 */

// Use same session key as portal for cross-subdomain auth
const SESSION_KEY = 'stom_session';
const CONVERSATION_KEY = 'ax_conversation_id';
const CONVERSATION_HISTORY_KEY = 'ax_conversation_history';

/**
 * Session object structure (from portal auth)
 * @typedef {Object} Session
 * @property {string} user_id - User identifier
 * @property {string} email - User email
 * @property {string} name - User display name
 * @property {number} timestamp - Login timestamp
 * @property {string} session_token - Server session token
 */

/**
 * Get current session from localStorage
 * @returns {Session|null}
 */
export function getSession() {
    try {
        const session = localStorage.getItem(SESSION_KEY);
        return session ? JSON.parse(session) : null;
    } catch (error) {
        console.error('Error reading session:', error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
    const session = getSession();
    return session !== null && session.session_token && session.user_id;
}

/**
 * Require authentication - redirect to portal login if not authenticated
 * Call this on protected pages (like chat)
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        // Redirect to portal login (root level)
        window.location.href = '/index.html';
        return false;
    }
    return true;
}

/**
 * Get current conversation ID from localStorage
 * @returns {string|null}
 */
export function getConversationId() {
    try {
        return localStorage.getItem(CONVERSATION_KEY);
    } catch (error) {
        console.error('Error reading conversation ID:', error);
        return null;
    }
}

/**
 * Store conversation ID in localStorage
 * @param {string} conversationId
 */
export function setConversationId(conversationId) {
    try {
        localStorage.setItem(CONVERSATION_KEY, conversationId);
    } catch (error) {
        console.error('Error storing conversation ID:', error);
    }
}

/**
 * Clear conversation (start fresh conversation)
 */
export function clearConversation() {
    try {
        localStorage.removeItem(CONVERSATION_KEY);
        localStorage.removeItem(CONVERSATION_HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing conversation:', error);
    }
}

/**
 * Get conversation history from localStorage
 * @returns {Array<Object>} Array of message objects
 */
export function getConversationHistory() {
    try {
        const history = localStorage.getItem(CONVERSATION_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error reading conversation history:', error);
        return [];
    }
}

/**
 * Save conversation history to localStorage
 * @param {Array<Object>} messages - Array of message objects
 */
export function saveConversationHistory(messages) {
    try {
        localStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('Error saving conversation history:', error);
    }
}

/**
 * Add message to conversation history
 * @param {Object} message - Message object with role, content, timestamp
 */
export function addMessageToHistory(message) {
    try {
        const history = getConversationHistory();
        history.push(message);
        saveConversationHistory(history);
    } catch (error) {
        console.error('Error adding message to history:', error);
    }
}
