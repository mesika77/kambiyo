import { BOT_NAME_PREFIXES, BOT_NAME_CORES, BOT_NAME_SUFFIXES, EMOJI_AVATARS } from './constants';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateBotName(): string {
  const prefix = pick(BOT_NAME_PREFIXES);
  const core = pick(BOT_NAME_CORES);
  const suffix = pick(BOT_NAME_SUFFIXES);
  return `${prefix}${core.charAt(0).toUpperCase()}${core.slice(1)}${suffix}`;
}

export function generateBotAvatar(usedAvatars: string[]): string {
  const available = EMOJI_AVATARS.filter(a => !usedAvatars.includes(a));
  return pick(available.length > 0 ? available : EMOJI_AVATARS);
}
