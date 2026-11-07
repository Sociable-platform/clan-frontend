export function buildDeveloper(overrides = {}) {
  return {
    id: '6f1c1d1e-8a43-4d0e-9d57-0c2f0b1f6a10',
    email: 'dev@example.com',
    name: 'Dev One',
    createdAt: '2026-11-06T10:00:00Z',
    ...overrides,
  };
}
