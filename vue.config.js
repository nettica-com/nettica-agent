const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      externals: ["vue-d3-network", "chokidar", "apexcharts", "auto-launch"],
      builderOptions: {
        productName: "Nettica Agent",
        files: ["**/*"],
        extraFiles: [
          {
            from: "public",
            to: "public",
            filter: ["**/*"],
          },
          {
            from: "extra",
            to: "extra",
            filter: ["**/*"],
          },
        ],
      },
      productName: "Nettica Agent",
      appId: "com.nettica.agent",
      author: "support@nettica.com",
      description: "Nettica Agent",
      win: {
        target: [
          {
            target: "nsis",
            arch: ["x64"],
          },
          {
            target: "msi",
            arch: ["x64"],
          },
          {
            target: "zip",
            arch: ["x64"],
          },
        ],
        icon: "build/icon.ico",
        appId: "com.nettica.agent",
        publisherName: "Nettica Corporation",
        legalTrademarks: "",
        verifyUpdateCodeSignature: false,
        requestedExecutionLevel: "requireAdministrator",
        artifactName: "${productName}-${version}.${ext}",
      },
      nsis: {
        include: "build/installer.nsh",
        guid: "41b73002-3848-4760-b965-6d5f43ba67a3",
        deleteAppDataOnUninstall: false,
        oneClick: true,
        perMachine: true,
        allowElevation: true,
        allowToChangeInstallationDirectory: false,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        artifactName: "nettica.agent-${version}.${ext}",
      },
    },
  },
});
