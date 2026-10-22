# CLAUDE.md — contexte du projet qbitiny

Interface web alternative (« alternative Web UI ») pour **qBittorrent**, en React 19 + Vite 7 + TypeScript + Tailwind v4 + shadcn/ui.
Fork de [qbitwebber](https://github.com/ksuaning-au/qbitwebber) (d'où le préfixe `qbitwebber_` des clés localStorage).
Repo GitHub : `nicolettijason/qbitiny`. Version actuelle dans `package.json` (`1.3.1`).

## Commandes

```bash
npm install
npm run dev          # serveur Vite, proxy /api -> backend qBittorrent (voir vite.config.ts)
npm run build        # tsc -b && vite build  -> release/qbitiny/public
npm run lint         # eslint
npm run demo         # mode démo sans backend (VITE_DEMO_MODE=true)
npm run demo:build
```

- Le mode démo passe par `vite --mode demo`, qui charge `.env.demo` (`VITE_DEMO_MODE=true`) — multiplateforme.
- ⚠️ `demo:build` écrit aussi dans `release/qbitiny/public` : ne pas commiter un build démo.
- Pas de tests automatisés. Vérifier avec `npm run build` (inclut le typecheck) et `npm run lint`.
- Proxy dev : `vite.config.ts` → `server.proxy['/api'].target` (actuellement une IP LAN perso `http://192.168.0.196:30024`).

## Build / release

- Sortie dans `release/qbitiny/public/` **versionnée dans git** (c'est ce que l'utilisateur pointe comme dossier Web UI alternatif dans qBittorrent). Les commits « rebuild » / « build release » régénèrent ce dossier.
- `base: "./"` → chemins relatifs, nécessaire pour être servi par qBittorrent.
- Plugin Vite maison `stripUnusedFlagVariant` : retire les drapeaux carrés (`.fis`) de `flag-icons` pour diviser par 2 les SVG embarqués.
- `VITE_APP_VERSION` est injecté depuis `package.json` (`define`). Pour publier : bumper la version dans `package.json` (+ rebuild/commit de `release/`), puis `git tag vX.Y.Z && git push origin vX.Y.Z`. Le workflow `.github/workflows/release.yml` vérifie que le tag = version du `package.json`, build, zippe `release/qbitiny` en `qbitiny-vX.Y.Z.zip` et crée la release (ou ajoute le zip si elle existe déjà). Le vérificateur de MAJ (`lib/github.ts`) pointe vers ce `.zip`.
- CI (`.github/workflows/ci.yml`) sur chaque PR et push sur `main` : `npm ci` + `npm run build` (bloquant) + `npm run lint` (non bloquant tant que la dette de lint existe).

## Architecture (`src/`)

```
main.tsx                 ThemeProvider (next-themes, classe "dark") + import CSS flag-icons
App.tsx                  QueryClientProvider > StorageProvider > AuthProvider > AppContent
                         Navigation par état local (activeTab), PAS de router.
                         Onglets : torrents | add | rss | search | logs | settings
lib/api.ts               QBittorrentClient : wrapper fetch de l'API WebUI v2 (/api/v2/...)
                         export `qbitClient` = demoClient si VITE_DEMO_MODE=true
lib/demoClient.ts        Faux client avec données mockées (même interface que l'API)
lib/github.ts            getLatestRelease() + compareVersions() (API GitHub releases/latest)
hooks/useApi.ts          Hooks React Query (queries + mutations) autour de qbitClient
hooks/useAuth.tsx        AuthContext : login auto au démarrage avec identifiants stockés
contexts/StorageContext  Unique point d'accès à localStorage (user, pass, préférences UI)
hooks/useStoragePreferences.ts  Façade simplifiée de StorageContext (sizeUnit, colonnes, titre onglet)
hooks/useSettingsPreferences.ts Chargement/sauvegarde des préférences qBittorrent par section
hooks/useTorrentListState.ts    Sélection, recherche, filtres (état/catégorie/tracker), tri, pagination
                                de la liste de torrents (utilisé par TorrentsView). L'état initial
                                (tri + filtres) vient des « defaults » sauvegardés (TorrentListDefaults)
helpers/index.ts         formatSize, formatTime, formatDate, labels/couleurs d'état & tracker, couleur de tag
constants/index.ts       defaultPreferences (dont colonnes par défaut), columnsDictionary, locales qBittorrent
types/index.ts           Types API (Torrent, TorrentFile, TorrentTracker, Peers, RSS, Search, Log, Preferences…)
components/
  Layout.tsx             Header (vitesses DL/UP, toggle thème), sidebar desktop, bottom nav mobile,
                         titre d'onglet dynamique "DL: x | UP: y" (option)
  LoginForm.tsx
  VersionCheckDialog.tsx Popup de nouvelle version (l'UI est entièrement en anglais)
  torrents/TorrentsView.tsx        (~1000 l.) rendu de la liste (table desktop + cartes mobile),
                                   colonnes configurables, menu de filtres, actions groupées
  torrents/TorrentDetailDialog.tsx (~1000 l.) stats, arbre de fichiers + priorités, trackers, peers (drapeaux)
  torrents/AddTorrentView.tsx      ajout par URL/magnet ou fichier .torrent
  search/SearchView.tsx            recherche via plugins qBittorrent (polling manuel 1 s), ajout du résultat
  rss/RSSView.tsx, logs/LogsView.tsx
  settings/              SettingsView = Tabs (General, Queueing, Speed, Connection, About)
                         GeneralTab regroupe GeneralSettingsTab + TableViewSettingsCard
                         + TorrentListDefaultsCard (tri/filtres par défaut) + AppearanceSettingsCard
                         + DefaultWebUICard (revenir à l'UI officielle)
  ui/                    Composants shadcn (style new-york) — générés, éviter de les modifier à la main
```

Alias d'import : `@/` → `src/`.

## Points importants / pièges

- **Auth** : `POST /api/v2/auth/login` ; le navigateur gère le cookie `SID` (même origine). Le code tente aussi de lire `set-cookie`/poser un header `Cookie`, ce qui est ignoré par les navigateurs — sans conséquence. 401/403 → `Error("Authentication required")`.
- **Identifiants en clair dans localStorage** (`qbit_user`, `qbit_pass`) pour l'auto-login. Lus de façon synchrone au premier rendu pour éviter un flash de la page de login.
- **localStorage** : toujours passer par `StorageContext` / `useStoragePreferences`. Seule exception : `VersionCheckDialog` (clé `qbitiny_dismissed_version`). Ajouter une clé = la déclarer dans `types/storage.ts`, `STORAGE_KEYS` et le contexte.
- **Tri/filtres par défaut** : clé `qbitiny_torrentListDefaults` (`{ sortField, sortDirection, states, categories, trackers }`, défaut dans `constants.defaultTorrentListDefaults`). Modifiables dans Settings → General ou via « Save sort & filters as default » dans le menu Filters de la liste. Appliqués à chaque montage de `TorrentsView` (changer d'onglet réinitialise donc l'état courant).
- **Préférences UI vs serveur** : `columns`, `sizeUnit` et les tri/filtres par défaut sont locaux (localStorage) ; le reste de `Preferences` vient de `/api/v2/app/preferences`. `useSettingsPreferences.handleSave(section)` n'envoie que les champs de la section (`general`, `queueing`, `speed`, `connection`).
- **Limites de vitesse** : l'API est en octets/s, l'UI en KiB/s → conversion ×/÷ 1024 au chargement et à la sauvegarde.
- **États de torrent** : qBittorrent ≥ 5 utilise `stoppedDL/stoppedUP` (start/stop) ; les anciens `pausedDL/pausedUP` sont aussi gérés. Les endpoints utilisés sont `torrents/stop` et `torrents/start` (API v5) même si les méthodes s'appellent `pauseTorrents`/`resumeTorrents`.
- **Polling React Query** : torrents/trackers/peers/logs 5 s, transfer info 3 s (en arrière-plan seulement si le titre d'onglet dynamique est activé). `staleTime` 5 s, `retry` 1.
- Le **demoClient** doit garder la même interface publique que `QBittorrentClient` : toute nouvelle méthode dans `api.ts` doit être ajoutée aussi dans `demoClient.ts`.
- `formatDate` affiche au format `jj/mm/aaaa hh:mm:ss`.
- Polices custom : Silkscreen (titre header), Doto — dans `src/assets/fonts`.

## Dette technique connue

- `TorrentsView.tsx` et `TorrentDetailDialog.tsx` sont très gros ; candidats au découpage.
- Type `Tab` dupliqué dans `App.tsx` et `Layout.tsx`.
- `npm run lint` remonte ~28 erreurs préexistantes (params `_x` inutilisés dans `demoClient`, `react-refresh/only-export-components` sur les contextes et composants shadcn, imports inutilisés…). Vérifier qu'une modif n'en ajoute pas, plutôt que viser 0.
- Indentation mixte (tabs majoritaires, quelques fichiers en 2 espaces / quotes simples comme `RSSView`, `LogsView`, `main.tsx`). Suivre le style du fichier modifié.

## Conventions de travail

- Branches `feature/...` ou `fix/...` puis PR vers `main`.
- Après une modif fonctionnelle destinée à être livrée : `npm run build` pour régénérer `release/` (commit séparé « rebuild » habituellement).
