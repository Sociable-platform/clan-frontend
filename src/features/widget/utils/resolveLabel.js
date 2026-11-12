/** Fills {Clan}, {clan}, {Clans} and {clans} in `text` with the developer's clan words. */
export function resolveLabel(text, terms) {
  const one = terms.clan.trim() || 'Clan';
  const many = terms.clans.trim() || 'Clans';
  return text
    .replaceAll('{Clan}', one)
    .replaceAll('{clan}', one.toLowerCase())
    .replaceAll('{Clans}', many)
    .replaceAll('{clans}', many.toLowerCase());
}
