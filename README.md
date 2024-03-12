# nettica-agent

## Project setup
```
nvm use 16.15.1
npm install
```

### Compiles and hot-reloads for development
```
npm run electron:serve
```

### Compiles and minifies for production
```
npm run electron:build
```
### Build cross-platform/cross-architecture
```
npm run electron:build -- --linux deb --arm64 --dir   # arm64 cross compile
npm run electron:build -- --linux deb --armv7l --dir  # pi cross compile

```
### Build for distribution (linux amd64/deb, amd64/rpm, arm7l/deb, arm64/deb, arm64/rpm)
```
./build.sh
```

### Lints and fixes files
```
npm run lint --fix
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

WireGuard® is a registered trademark of Jason A. Donenfeld.
