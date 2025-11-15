/**
 * Portal Authentication Client
 * WebAuthn/Passkey implementation for SixTwoOne Mind
 * Cross-subdomain session management
 */

// Windmill webhook base URL via Cloudflare Tunnel (synchronous endpoint)
const API_BASE_URL = 'https://api.sixtwoonemind.com/api/w/sixtwoonemind/jobs/run_wait_result/p/f/portal_auth';

// Windmill webhook tokens (script-specific)
const WEBHOOK_TOKENS = {
    passkey_register_options: 'QCxJ4X99VYAo79ZxqQHDRvrxkbWMovH7',
    passkey_register_verify: 'iusmWisDDLheLLfqj5m9BWVBcuOqcGDh',
    passkey_authenticate_options: 'wBeEBxRkIrlb9IyWDby5FeEo4zADXLHm',
    passkey_authenticate_verify: 'WcbUXOAISR3bdGaNamuwGxwEf7kXlI0f',
    signout: 'PSl8tzrBnscb9Y0EDrhCdrYOr1DfJYZE'
};

const SESSION_KEY = 'stom_session';

/**
 * Detect if running in production environment
 * @returns {boolean}
 */
function isProductionEnvironment() {
    const hostname = window.location.hostname;
    return hostname === 'sixtwoonemind.com' || hostname === 'www.sixtwoonemind.com';
}

/**
 * Get appropriate Supabase resource based on environment
 * @returns {string} Supabase resource identifier
 */
function getSupabaseResource() {
    return isProductionEnvironment()
        ? '$res:f/ax/supabase-ax'           // Production database
        : '$res:f/ax/supabase-ax-staging';  // Staging database
}

/**
 * Detect Relying Party ID based on current hostname
 * @returns {string} RP ID for WebAuthn (domain without protocol/path)
 */
function getRelyingPartyId() {
    const hostname = window.location.hostname;

    // Production domains
    if (hostname === 'sixtwoonemind.com' || hostname === 'www.sixtwoonemind.com') {
        return 'sixtwoonemind.com';
    }

    // Cloudflare Pages preview domains (*.portal-ar3.pages.dev)
    if (hostname.endsWith('.portal-ar3.pages.dev')) {
        return hostname;
    }

    // Default to production
    console.warn('Unknown hostname for WebAuthn:', hostname, '- defaulting to sixtwoonemind.com');
    return 'sixtwoonemind.com';
}

/**
 * Session object structure
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
 * Store session in localStorage
 * @param {Session} session
 */
export function setSession(session) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (error) {
        console.error('Error storing session:', error);
        throw new Error('Failed to store session');
    }
}

/**
 * Clear current session
 */
export function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Error clearing session:', error);
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
 * Require authentication - redirect to login if not authenticated
 * Call this on protected pages (like dashboard)
 */
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

/**
 * Convert ArrayBuffer to Base64URL string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function bufferToBase64URL(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Convert Base64URL string to ArrayBuffer
 * @param {string} base64url
 * @returns {ArrayBuffer}
 */
function base64URLToBuffer(base64url) {
    const base64 = base64url
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Register new passkey credential
 * @param {string} email - User email
 * @param {string} name - User display name
 * @returns {Promise<Session>}
 * @throws {Error}
 */
export async function registerPasskey(email, name) {
    try {
        const rpId = getRelyingPartyId();
        const supabaseResource = getSupabaseResource();
        console.log('Passkey registration with RP ID:', rpId);
        console.log('Using Supabase resource:', supabaseResource);

        // Step 1: Get registration options from server
        const optionsResponse = await fetch(`${API_BASE_URL}/passkey_register_options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_TOKENS.passkey_register_options}`
            },
            body: JSON.stringify({
                email,
                name,
                supabase: supabaseResource,
                rp_id: rpId
            })
        });

        if (!optionsResponse.ok) {
            throw new Error('Failed to get registration options');
        }

        const optionsData = await optionsResponse.json();
        if (!optionsData.success) {
            throw new Error(optionsData.error?.message || 'Registration options failed');
        }

        const options = optionsData.data;

        // Step 2: Create credential with WebAuthn
        const publicKeyOptions = {
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
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        });

        if (!credential) {
            throw new Error('Failed to create credential');
        }

        // Step 3: Send credential to server for verification
        const verificationResponse = await fetch(`${API_BASE_URL}/passkey_register_verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_TOKENS.passkey_register_verify}`
            },
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
                },
                supabase: supabaseResource,
                rp_id: rpId
            })
        });

        if (!verificationResponse.ok) {
            throw new Error('Failed to verify credential');
        }

        const verificationData = await verificationResponse.json();
        if (!verificationData.success) {
            throw new Error(verificationData.error?.message || 'Credential verification failed');
        }

        // Store session
        const session = verificationData.data;
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

/**
 * Authenticate with existing passkey
 * @returns {Promise<Session>}
 * @throws {Error}
 */
export async function authenticatePasskey() {
    try {
        const rpId = getRelyingPartyId();
        const supabaseResource = getSupabaseResource();
        console.log('Passkey authentication with RP ID:', rpId);
        console.log('Using Supabase resource:', supabaseResource);

        // Step 1: Get authentication options from server
        const optionsResponse = await fetch(`${API_BASE_URL}/passkey_authenticate_options`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_TOKENS.passkey_authenticate_options}`
            },
            body: JSON.stringify({
                supabase: supabaseResource,
                rp_id: rpId
            })
        });

        if (!optionsResponse.ok) {
            throw new Error('Failed to get authentication options');
        }

        const optionsData = await optionsResponse.json();
        if (!optionsData.success) {
            throw new Error(optionsData.error?.message || 'Authentication options failed');
        }

        const options = optionsData.data;

        // Step 2: Get credential with WebAuthn
        const publicKeyOptions = {
            challenge: base64URLToBuffer(options.challenge),
            timeout: options.timeout,
            rpId: options.rpId,
            allowCredentials: options.allowCredentials?.map(cred => ({
                id: base64URLToBuffer(cred.id),
                type: cred.type,
                transports: cred.transports
            })),
            userVerification: options.userVerification
        };

        const assertion = await navigator.credentials.get({
            publicKey: publicKeyOptions
        });

        if (!assertion) {
            throw new Error('Failed to get credential');
        }

        // Step 3: Send assertion to server for verification
        const verificationResponse = await fetch(`${API_BASE_URL}/passkey_authenticate_verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${WEBHOOK_TOKENS.passkey_authenticate_verify}`
            },
            body: JSON.stringify({
                credential: {
                    id: assertion.id,
                    rawId: bufferToBase64URL(assertion.rawId),
                    type: assertion.type,
                    response: {
                        clientDataJSON: bufferToBase64URL(assertion.response.clientDataJSON),
                        authenticatorData: bufferToBase64URL(assertion.response.authenticatorData),
                        signature: bufferToBase64URL(assertion.response.signature),
                        userHandle: assertion.response.userHandle ?
                            bufferToBase64URL(assertion.response.userHandle) : null
                    }
                },
                supabase: supabaseResource,
                rp_id: rpId
            })
        });

        if (!verificationResponse.ok) {
            throw new Error('Failed to verify assertion');
        }

        const verificationData = await verificationResponse.json();
        if (!verificationData.success) {
            throw new Error(verificationData.error?.message || 'Authentication verification failed');
        }

        // Store session
        const session = verificationData.data;
        setSession(session);

        return session;
    } catch (error) {
        console.error('Passkey authentication error:', error);
        if (error.name === 'NotAllowedError') {
            throw new Error('Authentication was cancelled or not allowed');
        }
        throw error;
    }
}

/**
 * Sign out user (clear session locally and on server)
 * @returns {Promise<void>}
 */
export async function signOut() {
    const session = getSession();

    // Clear local session first
    clearSession();

    // Notify server (best effort - don't throw if fails)
    if (session?.session_token) {
        try {
            const supabaseResource = getSupabaseResource();
            await fetch(`${API_BASE_URL}/signout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${WEBHOOK_TOKENS.signout}`
                },
                body: JSON.stringify({
                    session_token: session.session_token,
                    supabase: supabaseResource
                })
            });
        } catch (error) {
            console.error('Server signout failed (local session cleared):', error);
        }
    }
}

/**
 * Check if browser supports WebAuthn
 * @returns {boolean}
 */
export function supportsWebAuthn() {
    return !!(window.PublicKeyCredential &&
              navigator.credentials &&
              navigator.credentials.create);
}
