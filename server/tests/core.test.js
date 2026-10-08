import { describe, it, expect } from 'vitest';
import { parsePagination, paginatedResponse } from '../src/utils/http.js';
import { pick, toPublicUser } from '../src/utils/dto.js';
import { emailSchema, phoneE164Schema, paginationSchema } from '../src/validation/common.js';

describe('pagination + DTO + shared validation', () => {
  it('clamps page/limit (max 100)', () => {
    expect(parsePagination({ page: '0', limit: '5000' })).toEqual({ page: 1, limit: 100, offset: 0 });
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('builds totalPages envelopes', () => {
    expect(paginatedResponse([1], 95, 1, 20).pagination.totalPages).toBe(5);
  });

  it('toPublicUser strips secrets', () => {
    const dto = toPublicUser({
      id: 'u1', email: 'a@x.com', password_hash: 'secret', full_name: 'A',
      locale: 'en', status: 'active', created_at: 't', token: 'raw',
    });
    expect(dto).not.toHaveProperty('password_hash');
    expect(dto).not.toHaveProperty('token');
    expect(dto.id).toBe('u1');
  });

  it('pick ignores missing fields', () => {
    expect(pick({ a: 1 }, ['a', 'b'])).toEqual({ a: 1 });
  });

  it('shared schemas accept valid and reject invalid input', () => {
    expect(emailSchema.safeParse('A@Example.com').data).toBe('a@example.com');
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(phoneE164Schema.safeParse('+919876543210').success).toBe(true);
    expect(phoneE164Schema.safeParse('9876543210').success).toBe(false);
    expect(paginationSchema.parse({}).limit).toBe(20);
  });
});
