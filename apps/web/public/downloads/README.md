# App downloads

Drop the built Android APK here as `smomo.apk`, then flip `available: true` in
`src/lib/app-download.ts` (and update `version` / `sizeMb` / `releasedOn`).

Build it from `apps/mobile`:

```bash
cd apps/mobile
eas build -p android --profile preview   # produces an installable .apk
```

Download the resulting `.apk` from the EAS build page and save it as
`apps/web/public/downloads/smomo.apk`.

The `/download` page serves it and shows the version + size.
