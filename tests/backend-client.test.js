import test from 'node:test';
import assert from 'node:assert/strict';
import { createSupabaseBackend } from '../src/backend/supabase-client.js';

test('backend remains optional when Supabase environment is absent', async () => {
  const backend = createSupabaseBackend({});
  assert.equal(backend.configured, false);
  assert.equal((await backend.getUser()), null);
  assert.equal((await backend.loadProgress()).error, null);
});

test('configured backend exposes the Supabase client boundary', () => {
  const backend = createSupabaseBackend({
    VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
    VITE_SUPABASE_ANON_KEY: 'test-key',
  });
  assert.equal(backend.configured, true);
  assert.ok(backend.client);
});
