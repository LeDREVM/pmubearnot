# 🏇 PMU Dashboard — Netlify

Dashboard temps réel des courses PMU avec proxy serverless Netlify.

## Stack
- React 18 + Vite
- Netlify Functions (proxy CORS)
- API PMU non officielle : `turfinfo.api.pmu.fr`

## Deploy Netlify (méthode rapide)

### Option A — Netlify CLI (recommandé)
```bash
# 1. Install
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Dans le dossier du projet
npm install
netlify init        # crée le site Netlify
netlify deploy --build  # deploy preview
netlify deploy --build --prod  # deploy production
```

### Option B — GitHub + Netlify UI
1. Push ce dossier sur GitHub
2. Netlify → "Add new site" → "Import from Git"
3. Build command : `npm run build`
4. Publish directory : `dist`
5. Le `netlify.toml` gère tout le reste ✅

## Dev local
```bash
npm install
netlify dev   # lance Vite + Functions en local sur :8888
```

## Architecture
```
/api/pmu-proxy?date=25042026            → programme du jour
/api/pmu-proxy?date=25042026&reunion=2  → réunion R2
/api/pmu-proxy?date=25042026&reunion=2&course=1  → partants R2C1
```

## Notes
- Refresh auto toutes les 2 minutes
- Clic sur une course → charge les partants (lazy)
- Navigation jour par jour
- Filtre par discipline
