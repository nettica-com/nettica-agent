# nettica-agent

## Project setup
```
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

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
