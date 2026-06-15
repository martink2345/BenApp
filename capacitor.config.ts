import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cz.BenApp.app',
  appName: 'BenApp',
  webDir: 'www',
  plugins: {
    /**
     * Zapnutí nativního HTTP klienta. Díky tomu jdou requesty na mf.gov.cz,
     * Overpass API atd. mimo prohlížečové CORS (na zařízení).
     */
    CapacitorHttp: {
      enabled: true,
    },
    Geolocation: {},
  },
};

export default config;
