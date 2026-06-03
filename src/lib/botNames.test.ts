import { describe, it, expect } from 'vitest';
import { generateBotName, generateBotAvatar } from './botNames';

describe('generateBotName', () => {
  it('returns a non-empty string', () => {
    expect(generateBotName().length).toBeGreaterThan(0);
  });

  it('different calls produce varied results', () => {
    const names = new Set(Array.from({ length: 20 }, generateBotName));
    expect(names.size).toBeGreaterThan(3);
  });
});

describe('generateBotAvatar', () => {
  it('returns an emoji string', () => {
    expect(typeof generateBotAvatar([])).toBe('string');
  });

  it('avoids already-used avatars when possible', () => {
    const used = ['🦊','🐺','🐸','👾','🤖','💀','🎭','🦋','🔥','⚡','🌙','🎪','🦄','🐙'];
    const avatar = generateBotAvatar(used);
    expect(avatar).toBe('👻'); // only one left
  });
});
