import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.divideai',
  appName: 'DivideAi',
  webDir: 'dist',
  server: {
    url: 'https://6b09e28f-a899-4c0a-ac40-b9895525ffb2.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
