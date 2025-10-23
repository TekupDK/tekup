## GitHub Copilot Chat

- Extension Version: 0.32.0 (prod)
- VS Code: vscode/1.105.0
- OS: Windows

## Network

User Settings:

```json
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to <https://api.github.com>:
- DNS ipv4 Lookup: 140.82.121.6 (7 ms)
- DNS ipv6 Lookup: Error (15 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (0 ms)
- Electron fetch (configured): HTTP 200 (27 ms)
- Node.js https: HTTP 200 (93 ms)
- Node.js fetch: HTTP 200 (96 ms)

Connecting to <https://api.individual.githubcopilot.com/_ping>:
- DNS ipv4 Lookup: 140.82.112.21 (6 ms)
- DNS ipv6 Lookup: Error (12 ms): getaddrinfo ENOTFOUND api.individual.githubcopilot.com
- Proxy URL: None (2 ms)
- Electron fetch (configured): HTTP 200 (105 ms)
- Node.js https: HTTP 200 (342 ms)
- Node.js fetch: HTTP 200 (338 ms)

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).
