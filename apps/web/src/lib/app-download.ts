/**
 * Android APK download config — the single place to update when a new build ships.
 *
 * To publish a build:
 *   1. Build it:  cd apps/mobile && eas build -p android --profile preview
 *   2. Download the .apk from the EAS build page.
 *   3. Drop it at  apps/web/public/downloads/smomo.apk
 *      (or host it elsewhere and set `url` to that absolute URL).
 *   4. Set `available: true` and bump `version` / `sizeMb` / `releasedOn` below.
 *
 * While `available` is false the download page shows a "coming soon" state.
 */
export type AppDownload = {
  available: boolean;
  version: string;
  /** Relative path served from /public, or an absolute URL to a hosted APK. */
  url: string;
  /** Approx file size in MB, shown to the user. */
  sizeMb: number | null;
  minAndroid: string;
  releasedOn: string | null;
};

export const APP_DOWNLOAD: AppDownload = {
  available: false,
  version: '1.0.0',
  url: '/downloads/smomo.apk',
  sizeMb: null,
  minAndroid: '8.0',
  releasedOn: null,
};
