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
      'src/views/app/src/assets/base.css': 'views/app/src/assets/base.css',
      'src/views/app/src/assets/main.css': 'views/app/src/assets/main.css',
      'src/views/app/src/assets/electron.svg': 'views/app/src/assets/electron.svg',
      'src/views/app/src/assets/wavy-lines.svg': 'views/app/src/assets/wavy-lines.svg',
      'src/views/settings/index.html': 'views/settings/index.html',
      'src/views/settings/src/assets/base.css': 'views/settings/src/assets/base.css',
      'src/views/settings/src/assets/main.css': 'views/settings/src/assets/main.css',
      'src/views/settings/src/assets/electron.svg': 'views/settings/src/assets/electron.svg',
      'src/views/settings/src/assets/wavy-lines.svg': 'views/settings/src/assets/wavy-lines.svg'
    }
  }
}

export default config
