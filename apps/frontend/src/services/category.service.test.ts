import { describe, it, expect, beforeEach } from 'bun:test';
import { setAuthenticated } from '../test/helpers/auth';
import { categoryService } from './category.service';

beforeEach(() => setAuthenticated());

describe('categoryService.getCategories', () => {
  it('returns categories list from GET /api/categories', async () => {
    const result = await categoryService.getCategories();
    expect(result.categories).toHaveLength(1);
    const category = result.categories[0];
    expect(category.id).toBe('cat-1');
    expect(category.name).toBe('Food');
    expect(category.type).toBe('expense');
  });
});
