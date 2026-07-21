export interface Country {
  code: string;
  label: string;
}

export const DEFAULT_COUNTRY = 'NL';

export const COUNTRIES: Country[] = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'GB', label: '🇬🇧 United Kingdom' },
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'NL', label: '🇳🇱 Netherlands' },
  { code: 'NO', label: '🇳🇴 Norway' },
  { code: 'SE', label: '🇸🇪 Sweden' },
  { code: 'DK', label: '🇩🇰 Denmark' },
  { code: 'JP', label: '🇯🇵 Japan' },
  { code: 'IT', label: '🇮🇹 Italy' },
  { code: 'ES', label: '🇪🇸 Spain' },
  { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'NZ', label: '🇳🇿 New Zealand' },
  { code: 'TR', label: '🇹🇷 Turkey' },
];
