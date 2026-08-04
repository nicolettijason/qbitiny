# qbitiny

A simple and lightweight frontend for the qBittorrent Web UI.

> This project is a fork of [qbitwebber](https://github.com/ksuaning-au/qbitwebber) by [ksuaning-au](https://github.com/ksuaning-au).

Built with React, Vite and TypeScript.

## Features

- Torrent management
- RSS feeds
- Search
- Settings (simplified version compared to the official interface)
- Ability to add/remove and reorder columns
- Responsive design, mobile-friendly
- Light & dark mode

<img width="1892" height="503" alt="image" src="https://github.com/user-attachments/assets/ebcddab6-e906-4f45-b104-2c5b965a2188" />
<img width="1592" height="878" alt="image" src="https://github.com/user-attachments/assets/2645ea81-65a7-4934-82c5-75fba5795c64" />
<img width="535" height="776" alt="image" src="https://github.com/user-attachments/assets/199e6f87-39ed-42b2-b30b-b8a9bc4950d4" />

## Installation

Download the ZIP archive of this repository (or clone it), then set qBittorrent's custom Web UI path to the built (`release`) folder.

## Development

In development, the Vite server proxies API requests under `/api` to the qBittorrent backend.

By default, the proxy target is set in `vite.config.ts`, under `server.proxy['/api'].target`.

Change this value to the full URL (including protocol and port) of your qBittorrent backend. Examples:

- Default local qBittorrent: `http://localhost:8080`
- Remote machine on the local network: `http://192.168.1.100:8080`

To start development mode:

```bash
npm install
npm run dev
```

## Demo mode

To run the app without a backend, for demonstration purposes:

```bash
npm run demo
npm run demo:build
```

## Production build

```bash
npm run release
```

## Disclaimer

This project is intentionally minimalistic, so some features may be missing.

Long-term maintenance is not guaranteed.

To be used only for downloading Linux distributions and nothing else. 😉

## Contributing

Issues and pull requests are welcome.
