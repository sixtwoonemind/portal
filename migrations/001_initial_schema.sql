-- Ax Portal Database Schema
-- Production schema exported: 2025-11-13
-- For staging environment setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Authentication Tables
-- ============================================

-- Users table
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted'))
);

COMMENT ON TABLE users IS 'Portal users with email-based identity';
COMMENT ON COLUMN users.email IS 'Primary identifier - must be unique and verified';

-- Passkey credentials table
CREATE TABLE passkey_credentials (
    credential_id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id),
    public_key BYTEA NOT NULL,
    counter BIGINT DEFAULT 0 NOT NULL,
    transports TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    device_name TEXT
);

COMMENT ON TABLE passkey_credentials IS 'WebAuthn passkey credentials for passwordless authentication';
COMMENT ON COLUMN passkey_credentials.public_key IS 'WebAuthn public key for credential verification';
COMMENT ON COLUMN passkey_credentials.counter IS 'Signature counter to prevent replay attacks';

-- Auth sessions table
CREATE TABLE auth_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id),
    session_token TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    last_activity_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT
);

COMMENT ON TABLE auth_sessions IS 'Active authentication sessions with token-based validation';
COMMENT ON COLUMN auth_sessions.session_token IS 'Bearer token for API authentication';

-- WebAuthn challenges table
CREATE TABLE webauthn_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(user_id),
    email TEXT,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false
);

COMMENT ON TABLE webauthn_challenges IS 'Temporary challenge storage for WebAuthn flows';
COMMENT ON COLUMN webauthn_challenges.challenge IS 'Base64URL-encoded random challenge for WebAuthn ceremony';

-- ============================================
-- Conversation Management Tables
-- ============================================

-- Conversation sessions table (multi-conversation support)
CREATE TABLE conversation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    bot_id TEXT NOT NULL,
    conversation_id TEXT NOT NULL,
    title TEXT,
    is_archived BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE conversation_sessions IS 'Maps user sessions to OpenAI conversation IDs with multi-conversation support';
COMMENT ON COLUMN conversation_sessions.title IS 'Auto-generated or user-editable conversation title';
COMMENT ON COLUMN conversation_sessions.is_archived IS 'Whether conversation is archived (hidden from main list)';
COMMENT ON COLUMN conversation_sessions.is_pinned IS 'Whether conversation is pinned to top of list';
COMMENT ON COLUMN conversation_sessions.last_message_at IS 'Timestamp of most recent message for sorting';

-- ============================================
-- Anima Block Tables (for future use)
-- ============================================

-- Organizations table
CREATE TABLE organizations (
    organization_id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    status VARCHAR DEFAULT 'active'
);

-- Bots table
CREATE TABLE bots (
    bot_id VARCHAR PRIMARY KEY,
    organization_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    role VARCHAR NOT NULL,
    description TEXT,
    core_blocks JSONB,
    deployed_at TIMESTAMP,
    last_active_at TIMESTAMP,
    status VARCHAR DEFAULT 'active',
    version INTEGER DEFAULT 1
);

COMMENT ON TABLE bots IS 'Deployed AI assistants with dynamic block loading capability';

-- Concepts table
CREATE TABLE concepts (
    concept_id VARCHAR PRIMARY KEY,
    organization_id VARCHAR NOT NULL,
    bot_id VARCHAR,
    name VARCHAR DEFAULT 'Unnamed Concept' NOT NULL,
    layer VARCHAR DEFAULT 'id' CHECK (layer IN ('id', 'org', 'training', 'role')),
    tags TEXT[] NOT NULL,
    definition TEXT NOT NULL,
    properties JSONB,
    effects TEXT,
    supporting_examples TEXT[],
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by VARCHAR,
    version INTEGER DEFAULT 1
);

COMMENT ON TABLE concepts IS 'Organizational knowledge and entity definitions';
COMMENT ON COLUMN concepts.name IS 'Human-friendly conceptual handle for compression and auditability';

-- Logic blocks table
CREATE TABLE logic_blocks (
    logic_id VARCHAR PRIMARY KEY,
    organization_id VARCHAR NOT NULL,
    bot_id VARCHAR,
    name VARCHAR DEFAULT 'Unnamed Logic' NOT NULL,
    layer VARCHAR DEFAULT 'training' CHECK (layer IN ('id', 'org', 'training', 'role')),
    tags TEXT[] NOT NULL,
    applies_when TEXT NOT NULL,
    successful_pattern TEXT NOT NULL,
    unsuccessful_pattern TEXT NOT NULL,
    extends_to TEXT,
    supporting_examples TEXT[],
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by VARCHAR,
    version INTEGER DEFAULT 1
);

COMMENT ON TABLE logic_blocks IS 'Reasoning pattern guidance with three-vector structure';
COMMENT ON COLUMN logic_blocks.name IS 'Human-friendly pattern name for cognitive indexing';
COMMENT ON COLUMN logic_blocks.extends_to IS 'Attention guidance: related areas this pattern extends into (not mandatory actions)';

-- Examples table
CREATE TABLE examples (
    example_id VARCHAR PRIMARY KEY,
    organization_id VARCHAR NOT NULL,
    bot_id VARCHAR,
    name VARCHAR DEFAULT 'Unnamed Example' NOT NULL,
    layer VARCHAR DEFAULT 'training' CHECK (layer IN ('id', 'org', 'training', 'role')),
    tags TEXT[] NOT NULL,
    input TEXT NOT NULL,
    output TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by VARCHAR,
    version INTEGER DEFAULT 1
);

COMMENT ON TABLE examples IS 'Neutral demonstrations forcing pattern recognition over answer matching';
COMMENT ON COLUMN examples.name IS 'Human-friendly example label for quick identification';
COMMENT ON COLUMN examples.input IS 'Triggering context, situation, or data (neutral structure)';
COMMENT ON COLUMN examples.output IS 'What happened or resulted (neutral structure)';

-- Output blocks table
CREATE TABLE output_blocks (
    output_id VARCHAR PRIMARY KEY,
    organization_id VARCHAR NOT NULL,
    bot_id VARCHAR,
    name VARCHAR DEFAULT 'Unnamed Output' NOT NULL,
    layer VARCHAR DEFAULT 'training' CHECK (layer IN ('id', 'org', 'training', 'role')),
    tags TEXT[] NOT NULL,
    output_type TEXT NOT NULL,
    interaction_flow TEXT NOT NULL,
    restrictions TEXT[],
    supporting_examples TEXT[],
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    created_by VARCHAR,
    version INTEGER DEFAULT 1
);

COMMENT ON TABLE output_blocks IS 'Interaction pattern choreography for different contexts';
COMMENT ON COLUMN output_blocks.name IS 'Human-friendly interaction pattern label';
COMMENT ON COLUMN output_blocks.interaction_flow IS 'Positive guidance: choreography steps';
COMMENT ON COLUMN output_blocks.restrictions IS 'Negative guidance: hard boundaries (promoted field for emphasis)';

-- Compilations table
CREATE TABLE compilations (
    compilation_id VARCHAR PRIMARY KEY,
    bot_id VARCHAR REFERENCES bots(bot_id),
    blocks_snapshot JSONB NOT NULL,
    compiled_at TIMESTAMP DEFAULT now(),
    compiled_by VARCHAR,
    notes TEXT
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Auth indexes
CREATE INDEX idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX idx_passkey_credentials_user ON passkey_credentials(user_id);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX idx_users_email ON users(email);

-- Conversation indexes
CREATE INDEX idx_conversation_sessions_user_bot ON conversation_sessions(user_id, bot_id);
CREATE INDEX idx_conversation_sessions_conversation ON conversation_sessions(conversation_id);
CREATE INDEX idx_conversation_sessions_archived ON conversation_sessions(is_archived);
CREATE INDEX idx_conversation_sessions_last_message ON conversation_sessions(last_message_at DESC);

-- Anima block indexes
CREATE INDEX idx_concepts_org_bot ON concepts(organization_id, bot_id);
CREATE INDEX idx_logic_blocks_org_bot ON logic_blocks(organization_id, bot_id);
CREATE INDEX idx_examples_org_bot ON examples(organization_id, bot_id);
CREATE INDEX idx_output_blocks_org_bot ON output_blocks(organization_id, bot_id);
