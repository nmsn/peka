import type { ElectrobunConfig } from 'electrobun/bun'

const config: ElectrobunConfig = {
  app: {
    name: 'Peka',
    identifier: 'com.peka.app',
    version: '0.1.0-alpha.1',
    description: 'Peka - A color picker for macOS'
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts'
    },
    views: {
      app: {
        entrypoint: 'src/views/app/main.ts'
      },
      settings: {
        entrypoint: 'src/views/settings/main.ts'
      }
    },
    copy: {
      'src/native/macos/color-picker.swift': 'native/macos/color-picker.swift',
      'resources/tray.png': 'resources/tray.png',
      'src/views/app/index.html': 'views/app/index.html',
      'src/views/app/base.css': 'views/app/base.css',
      'src/views/app/main.css': 'views/app/main.css',
      'src/views/settings/index.html': 'views/settings/index.html',
      'src/views/settings/base.css': 'views/settings/base.css',
      'src/views/settings/main.css': 'views/settings/main.css',
      'src/views/shared/assets/electron.svg': 'views/shared/assets/electron.svg',
      'src/views/shared/assets/wavy-lines.svg': 'views/shared/assets/wavy-lines.svg'
    },
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
    },
  }
}

export default config
