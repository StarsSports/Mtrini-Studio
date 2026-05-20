# Security Specification: Mtrini 1.0

## 1. Data Invariants
- **Identity Lock**: A user's profile at `users/{userId}` is strictly private. Only the authenticated user matching `request.auth.uid` can read or write it.
- **Relational Integrity**: Chat threads at `chats/{chatId}` can only be read, listed, updated, or written by the user mapped in `userId`.
- **Master Gate Verification**: Messages at `chats/{chatId}/messages/{messageId}` cannot be queried or added without verifying that the parent document `chats/{chatId}` is owned by the current authenticated user.
- **Credit Stability**: Users cannot self-escalate or arbitrarily adjust their credits. Credits can only be set or incremented using server actions.
- **Timestamp Authenticity**: All creations and updates require server-signed timestamps (`request.time`).

## 2. The "Dirty Dozen" Malicious Payloads (Attempted and Prevented)
1. **PII Intrusion**: Attacker attempts to `get` the user profile of another user ID `victim123`. (Outcome: `PERMISSION_DENIED`)
2. **Profile Spoofing**: User `attacker456` attempts to create a profile at `users/victim123`. (Outcome: `PERMISSION_DENIED`)
3. **Credit Inflation**: User attempts to update `credits` in their profile to `99999`. (Outcome: `PERMISSION_DENIED` since client edits are constrained to selected configuration options or blocked).
4. **Junk ID Poisoning**: Attacker attempts to create a chat with an ID of 2,000 characters to bloat database storage. (Outcome: `PERMISSION_DENIED` via `isValidId()`).
5. **Chat Hijacking**: User `attacker456` attempts to read a private chat thread at `chats/chat_victim123`. (Outcome: `PERMISSION_DENIED`).
6. **Chat Theft on Creation**: User `attacker456` attempts to create `chats/new_chat` with `userId = 'victim123'`. (Outcome: `PERMISSION_DENIED`).
7. **Junk Message Bloating**: Attacker attempts to write a message with content of 10MB into a chat thread. (Outcome: `PERMISSION_DENIED`).
8. **Orphaned Message Entry**: Attacker attempts to write a message at `/chats/nonexistent_chat/messages/msg1` where the parent chat does not exist. (Outcome: `PERMISSION_DENIED`).
9. **Message Spoofing**: Attacker attempts to list messages of `/chats/chat_victim123/messages` for a chat they do not own. (Outcome: `PERMISSION_DENIED`).
10. **State Shortcutting**: Attacker attempts to change Chat owner `userId` upon update to escape billing logic. (Outcome: `PERMISSION_DENIED`).
11. **Shadow Property Insertion**: Attacker attempts to insert a custom role such as `{ isAdmin: true }` during registration. (Outcome: `PERMISSION_DENIED`).
12. **Temporal Spoofing**: Attacker submits a client-side timestamp `createdAt: '2020-01-01'` to bypass ordering. (Outcome: `PERMISSION_DENIED`).
