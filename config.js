// Birthday Celebration Configuration & Dynamic Theming Engine

export const THEMES = {
  rose: {
    id: 'rose',
    name: '🌸 Rose Blossom (Default)',
    bgGradStart: '#ffffff',
    bgGradEnd: '#fff0f3',
    primary: '#d81b60',
    primaryGradStart: '#ff6b8b',
    primaryGradEnd: '#ff8da1',
    primaryGlow: 'rgba(255, 107, 139, 0.4)',
    accent: '#ffb300',
    choco: '#3e2723',
    frosting: '#5d4037',
    cakeText: '#ffd54f',
    cardLeftBg: '#faf7f5',
    cardBorder: '#e0d5ce'
  },
  royal: {
    id: 'royal',
    name: '👑 Royal Midnight & Gold',
    bgGradStart: '#1a237e',
    bgGradEnd: '#0d133a',
    primary: '#ffd700',
    primaryGradStart: '#ffb300',
    primaryGradEnd: '#f57f17',
    primaryGlow: 'rgba(255, 179, 0, 0.45)',
    accent: '#00e5ff',
    choco: '#212121',
    frosting: '#37474f',
    cakeText: '#ffd700',
    cardLeftBg: '#101735',
    cardBorder: '#3949ab'
  },
  emerald: {
    id: 'emerald',
    name: '🌿 Emerald Luxury',
    bgGradStart: '#e8f5e9',
    bgGradEnd: '#c8e6c9',
    primary: '#2e7d32',
    primaryGradStart: '#43a047',
    primaryGradEnd: '#66bb6a',
    primaryGlow: 'rgba(67, 160, 71, 0.4)',
    accent: '#ffd700',
    choco: '#2e3d2f',
    frosting: '#3d523e',
    cakeText: '#fff176',
    cardLeftBg: '#f1f8e9',
    cardBorder: '#a5d6a7'
  },
  lavender: {
    id: 'lavender',
    name: '💜 Lavender Dream',
    bgGradStart: '#f3e5f5',
    bgGradEnd: '#e1bee7',
    primary: '#7b1fa2',
    primaryGradStart: '#ab47bc',
    primaryGradEnd: '#ba68c8',
    primaryGlow: 'rgba(171, 71, 188, 0.4)',
    accent: '#ff4081',
    choco: '#311b92',
    frosting: '#4a148c',
    cakeText: '#e1bee7',
    cardLeftBg: '#f8f0fb',
    cardBorder: '#ce93d8'
  },
  sunset: {
    id: 'sunset',
    name: '🌅 Sunset Coral',
    bgGradStart: '#fff3e0',
    bgGradEnd: '#ffe0b2',
    primary: '#e64a19',
    primaryGradStart: '#ff7043',
    primaryGradEnd: '#ff8a65',
    primaryGlow: 'rgba(255, 112, 67, 0.4)',
    accent: '#fbc02d',
    choco: '#4e342e',
    frosting: '#6d4c41',
    cakeText: '#ffe082',
    cardLeftBg: '#fff8e1',
    cardBorder: '#ffcc80'
  },
  chocolate: {
    id: 'chocolate',
    name: '🍫 Chocolate Artisan',
    bgGradStart: '#efebe9',
    bgGradEnd: '#d7ccc8',
    primary: '#4e342e',
    primaryGradStart: '#6d4c41',
    primaryGradEnd: '#8d6e63',
    primaryGlow: 'rgba(109, 76, 65, 0.4)',
    accent: '#ffb300',
    choco: '#271714',
    frosting: '#3e2723',
    cakeText: '#ffd54f',
    cardLeftBg: '#ece6e2',
    cardBorder: '#bcaaa4'
  }
};

export const DEFAULT_CONFIG = {
  name: 'Mame',
  age: '60',
  headline: 'Happy 60th Birthday Mame!',
  message: 'Wishing you a diamond milestone filled with endless health, bright laughter, warmth, and all the love in the world.\n\nThank you for every moment, wisdom, and smile. Here is to your best chapter yet!',
  photoUrl: 'mame.jpg',
  theme: 'rose'
};

export function getOrdinalSuffix(num) {
  const n = parseInt(num, 10);
  if (isNaN(n)) return '';
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return n + 'st';
  if (j === 2 && k !== 12) return n + 'nd';
  if (j === 3 && k !== 13) return n + 'rd';
  return n + 'th';
}

export function loadConfig() {
  const urlParams = new URLSearchParams(window.location.search);
  const saved = localStorage.getItem('birthday_app_config');
  let baseConfig = { ...DEFAULT_CONFIG };

  if (saved) {
    try {
      baseConfig = { ...baseConfig, ...JSON.parse(saved) };
    } catch (e) {
      console.warn('Failed to parse saved birthday config', e);
    }
  }

  // URL parameters take highest priority
  const config = {
    name: urlParams.get('name') || baseConfig.name,
    age: urlParams.get('age') || baseConfig.age,
    headline: urlParams.get('headline') || (urlParams.get('age') ? `Happy ${getOrdinalSuffix(urlParams.get('age'))}! ✨` : baseConfig.headline),
    message: urlParams.get('msg') || urlParams.get('message') || baseConfig.message,
    photoUrl: urlParams.get('photo') || baseConfig.photoUrl,
    theme: urlParams.get('theme') || baseConfig.theme
  };

  if (!THEMES[config.theme]) {
    config.theme = 'rose';
  }

  return config;
}

export function saveConfig(config) {
  localStorage.setItem('birthday_app_config', JSON.stringify(config));
}

export function generateShareableUrl(config) {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('name', config.name);
  url.searchParams.set('age', config.age);
  url.searchParams.set('headline', config.headline);
  url.searchParams.set('msg', config.message);
  url.searchParams.set('photo', config.photoUrl);
  url.searchParams.set('theme', config.theme);
  return url.toString();
}
