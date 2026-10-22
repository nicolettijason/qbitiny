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
- Bundle initial ~450 kB JS / ~75 kB CSS grâce au lazy-loading (voir Architecture) : garder les nouvelles vues/dialogs lourds en `React.lazy`.
- Plugin Vite maison `stripUnusedFlagVariant` : retire les drapeaux carrés (`.fis`) de `flag-icons` pour diviser par 2 les SVG embarqués.
- `VITE_APP_VERSION` est injecté depuis `package.json` (`define`). Pour publier : bumper la version dans `package.json` (+ rebuild/commit de `release/`), puis `git tag vX.Y.Z && git push origin vX.Y.Z`. Le workflow `.github/workflows/release.yml` vérifie que le tag = version du `package.json`, build, zippe `release/qbitiny` en `qbitiny-vX.Y.Z.zip` et crée la release (ou ajoute le zip si elle existe déjà). Le vérificateur de MAJ (`lib/github.ts`) pointe vers ce `.zip`.
- CI (`.github/workflows/ci.yml`) sur chaque PR et push sur `main` : `npm ci` + `npm run build` (bloquant) + `npm run lint` (non bloquant tant que la dette de lint existe).

## Architecture (`src/`)

```
main.tsx                 ThemeProvider (next-themes, classe "dark")
App.tsx                  QueryClientProvider > StorageProvider > AuthProvider > AppContent
                         Navigation par état local (activeTab), PAS de router.
                         Onglets : torrents | add | rss | search | logs | settings
                         TorrentsView est chargé directement ; les autres vues via React.lazy + Suspense
lib/api.ts               QBittorrentClient : wrapper fetch de l'API WebUI v2 (/api/v2/...), gère la
                         session (checkSession, re-login auto sur 401/403)
                         export `qbitClient` = demoClient si VITE_DEMO_MODE=true
lib/demoClient.ts        Faux client avec données mockées (même interface que l'API)
lib/github.ts            getLatestRelease() + compareVersions() (API GitHub releases/latest)
hooks/useApi.ts          Hooks React Query (queries + mutations) autour de qbitClient ;
                         useTorrents() = synchro incrémentale via /sync/maindata
hooks/useAuth.tsx        AuthContext : restauration de session au démarrage, login/logout, « Remember me »
contexts/StorageContext  Unique point d'accès à localStorage (user, pass mémorisé, préférences UI)
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
  torrents/TorrentDetailDialog.tsx (~1000 l.) stats, arbre de fichiers + priorités, trackers, peers (drapeaux).
                                   Lazy-loadé à la 1re ouverture (puis reste monté) ; c'est lui qui importe
                                   le CSS flag-icons (~210 kB), donc hors du bundle initial
  torrents/AddTorrentView.tsx      ajout par URL/magnet ou fichier .torrent
  search/SearchView.tsx            recherche via plugins qBittorrent (polling manuel 1 s), ajout du résultat
  rss/RSSView.tsx
  logs/LogsView.tsx      100 entrées les plus récentes en haut, filtre par niveau (Normal/Info/Warning/Critical)
  settings/              SettingsView = Tabs (General, Queueing, Speed, Connection, About)
                         GeneralTab regroupe GeneralSettingsTab + TableViewSettingsCard
                         + TorrentListDefaultsCard (tri/filtres par défaut) + AppearanceSettingsCard
                         + DefaultWebUICard (revenir à l'UI officielle)
  ui/                    Composants shadcn (style new-york) — générés, éviter de les modifier à la main
```

Alias d'import : `@/` → `src/`.

## Points importants / pièges

- **Auth** : la session repose sur le cookie `SID` de qBittorrent, géré par le navigateur (même origine, aucun header à poser).
  - `login()` : qBittorrent répond **200 `Fails.`** sur mauvais identifiants → le succès se teste sur le corps `Ok.`, pas sur `response.ok`.
  - Au démarrage (`useAuth`) : `checkSession()` (GET `/app/version`) réutilise une session valide (marche aussi si qBittorrent bypasse l'auth pour localhost/whitelist) ; sinon login avec le mot de passe mémorisé s'il existe.
  - Le mot de passe reste en mémoire dans le client : sur 401/403 en cours d'utilisation, `request()` refait un login (partagé entre requêtes concurrentes) puis rejoue la requête une fois.
  - `isConfigured()` = « authentifié » ; sert de `enabled` à toutes les queries React Query.
  - **Remember me** (coché par défaut dans `LoginForm`) : seul cas où le mot de passe est stocké, **en clair** dans `qbit_pass` (localStorage). Décoché ou logout → clé supprimée. Choix assumé : app destinée à un serveur, il ne faut pas devoir se reconnecter souvent.
- **localStorage** : toujours passer par `StorageContext` / `useStoragePreferences`. Seule exception : `VersionCheckDialog` (clé `qbitiny_dismissed_version`). Ajouter une clé = la déclarer dans `types/storage.ts`, `STORAGE_KEYS` et le contexte.
- **Tri/filtres par défaut** : clé `qbitiny_torrentListDefaults` (`{ sortField, sortDirection, states, categories, trackers }`, défaut dans `constants.defaultTorrentListDefaults`). Modifiables dans Settings → General ou via « Save sort & filters as default » dans le menu Filters de la liste. Appliqués au chargement de la page et réappliqués dès qu'ils sont modifiés.
- **`TorrentsView` reste monté** (masqué via `hidden`) quand un autre onglet est actif : recherche, filtres, page, sélection et scroll sont conservés, et le polling des torrents continue en arrière-plan.
- **Préférences UI vs serveur** : `columns`, `sizeUnit` et les tri/filtres par défaut sont locaux (localStorage) ; le reste de `Preferences` vient de `/api/v2/app/preferences`. `useSettingsPreferences.handleSave(section)` n'envoie que les champs de la section (`general`, `queueing`, `speed`, `connection`).
- **Limites de vitesse** : l'API est en octets/s, l'UI en KiB/s → conversion ×/÷ 1024 au chargement et à la sauvegarde.
- **États de torrent** : qBittorrent ≥ 5 utilise `stoppedDL/stoppedUP` (start/stop) ; les anciens `pausedDL/pausedUP` sont aussi gérés. Les endpoints utilisés sont `torrents/stop` et `torrents/start` (API v5) même si les méthodes s'appellent `pauseTorrents`/`resumeTorrents`.
- **Polling React Query** : torrents/trackers/peers/logs 5 s, transfer info 3 s (en arrière-plan seulement si le titre d'onglet dynamique est activé). `staleTime` 5 s, `retry` 1.
- **Liste des torrents** : `useTorrents()` interroge `/sync/maindata?rid=N` et fusionne les diffs dans une `Map` au niveau module (`full_update` → reset, `torrents_removed` → suppression ; le hash n'est pas dans l'objet torrent, c'est la clé). Les synchros sont sérialisées (une mutation qui invalide `["torrents"]` ne part pas en parallèle du polling). En cas d'erreur, `rid` revient à 0 ; un `rid` inconnu du serveur renvoie de toute façon une mise à jour complète.
- **Logs** : `/log/main` renvoie le niveau en **entier** (`LogType` : 1 Normal, 2 Info, 4 Warning, 8 Critical), du plus ancien au plus récent.
- Le **demoClient** doit garder la même interface publique que `QBittorrentClient` : toute nouvelle méthode dans `api.ts` doit être ajoutée aussi dans `demoClient.ts`.
- `formatDate` affiche au format `jj/mm/aaaa hh:mm:ss`.
- Polices custom : Silkscreen (titre header), Doto — dans `src/assets/fonts`.

## Dette technique connue

- `TorrentsView.tsx` et `TorrentDetailDialog.tsx` sont très gros ; candidats au découpage.
- Type `Tab` dupliqué dans `App.tsx` et `Layout.tsx`.
- `npm run lint` remonte ~28 erreurs préexistantes (params `_x` inutilisés dans `demoClient`, `react-refresh/only-export-components` sur les contextes et composants shadcn, imports inutilisés…). Vérifier qu'une modif n'en ajoute pas, plutôt que viser 0.
- Indentation mixte (tabs majoritaires, quelques fichiers en 2 espaces / quotes simples comme `RSSView`, `LogsView`, `main.tsx`). Suivre le style du fichier modifié.

## Conventions de travail

- Une branche par sujet (`feature/`, `fix/`, `perf/`, `ci/`, `docs/`…) depuis `main`, une PR par branche.
- `main` est protégée (1 review de code owner requise) : l'auteur ne pouvant pas s'auto-approuver, les PR sont fusionnées avec `gh pr merge <n> --merge --admin` — **uniquement quand l'utilisateur le demande**.
- Après une modif fonctionnelle destinée à être livrée : `npm run build` pour régénérer `release/` (commit séparé « rebuild » habituellement).

## Environnement (poste Windows de l'utilisateur)

- `gh` est installé mais pas dans le PATH de Git Bash : l'appeler via `"/c/Program Files/GitHub CLI/gh.exe"` et toujours passer `--repo nicolettijason/qbitiny` (sinon il cible le remote `upstream`, le repo d'origine qbitwebber).
- Pas de Python : utiliser Node pour les scripts ponctuels.
- Le repo est en CRLF (`.gitattributes` : `text=auto`).
