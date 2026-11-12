/**
 * The curated Google Fonts list (the same 43 families as the config v1 schema) with the generic
 * family used as a fallback. A family that is not listed is never used, so a config cannot make
 * the page ask for an arbitrary font.
 */
const FALLBACKS = {
  Sans: 'sans-serif',
  Display: 'sans-serif',
  'Sci-fi': 'sans-serif',
  Pixel: 'monospace',
  Fantasy: 'serif',
  Cartoon: 'sans-serif',
  Mono: 'monospace',
};

const FONT_ROWS = [
  ['Inter', 'Sans'], ['Roboto', 'Sans'], ['Open Sans', 'Sans'], ['Lato', 'Sans'], ['Montserrat', 'Sans'], ['Poppins', 'Sans'],
  ['Nunito', 'Sans'], ['Rubik', 'Sans'], ['Space Grotesk', 'Sans'], ['Kanit', 'Sans'], ['Titillium Web', 'Sans'], ['Quicksand', 'Sans'],
  ['Unbounded', 'Display'], ['Oswald', 'Display'], ['Bebas Neue', 'Display'], ['Anton', 'Display'], ['Teko', 'Display'],
  ['Righteous', 'Display'], ['Bungee', 'Display'],
  ['Orbitron', 'Sci-fi'], ['Exo 2', 'Sci-fi'], ['Rajdhani', 'Sci-fi'], ['Audiowide', 'Sci-fi'], ['Chakra Petch', 'Sci-fi'],
  ['Saira', 'Sci-fi'], ['Russo One', 'Sci-fi'], ['Black Ops One', 'Display'],
  ['Press Start 2P', 'Pixel'], ['VT323', 'Pixel'], ['Silkscreen', 'Pixel'], ['Pixelify Sans', 'Pixel'],
  ['Cinzel', 'Fantasy'], ['MedievalSharp', 'Fantasy'], ['Uncial Antiqua', 'Fantasy'], ['Pirata One', 'Fantasy'], ['Metamorphous', 'Fantasy'],
  ['Fredoka', 'Cartoon'], ['Baloo 2', 'Cartoon'], ['Luckiest Guy', 'Cartoon'], ['Bangers', 'Cartoon'], ['Comfortaa', 'Cartoon'],
  ['JetBrains Mono', 'Mono'], ['Share Tech Mono', 'Mono'],
];

export const FONT_FAMILIES = FONT_ROWS.map(([family]) => family);

const FALLBACK_BY_FAMILY = new Map(FONT_ROWS.map(([family, category]) => [family, FALLBACKS[category]]));

export const DEFAULT_FONT_FAMILY = 'Inter';

/** A CSS `font-family` value for a curated family, or for the default when the name is unknown. */
export function fontStack(family) {
  const name = FALLBACK_BY_FAMILY.has(family) ? family : DEFAULT_FONT_FAMILY;
  return `'${name}', ${FALLBACK_BY_FAMILY.get(name)}`;
}

/**
 * Google Fonts stylesheet URL for the families a config uses. The renderer never loads it (a
 * Shadow DOM cannot host @font-face), so the page that mounts the panel adds the link.
 */
export function googleFontsHref(config) {
  const families = [config?.theme?.fonts?.heading?.family, config?.theme?.fonts?.body?.family]
    .map((family) => (FALLBACK_BY_FAMILY.has(family) ? family : DEFAULT_FONT_FAMILY))
    .filter((family, index, all) => all.indexOf(family) === index);
  const query = families.map((family) => `family=${family.replace(/ /g, '+')}:wght@400;500;600`).join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}
