import type { ValidationTarget } from './contracts'

export const validationTargets: ValidationTarget[] = [
  {
    id: 'window-startup',
    title: 'Main window starts and loads a renderer',
    status: 'pending',
    required: true,
    notes: [
      'Load a renderer page in development mode.',
      'Confirm the app can restart quickly during iteration.'
    ]
  },
  {
    id: 'request-response',
    title: 'Renderer can call into main runtime',
    status: 'pending',
    required: true,
    notes: ['Implement one request/response bridge method.']
  },
  {
    id: 'event-push',
    title: 'Main runtime can push events into renderer',
    status: 'pending',
    required: true,
    notes: ['Mirror the existing window maximize event as the first pushed event.']
  },
  {
    id: 'frameless-window',
    title: 'Frameless window controls work',
    status: 'pending',
    required: true,
    notes: ['Support drag area, minimize, maximize, restore, and close.']
  },
  {
    id: 'tray',
    title: 'Tray or menubar mode works',
    status: 'pending',
    required: true,
    notes: ['Clicking the tray icon toggles the window.', 'Tray menu triggers a foreground pick action.']
  },
  {
    id: 'global-shortcut',
    title: 'At least one global shortcut works',
    status: 'pending',
    required: true,
    notes: ['Start with the foreground picker shortcut.']
  },
  {
    id: 'macos-color-pick',
    title: 'Interactive color picking works on macOS',
    status: 'pending',
    required: true,
    notes: ['This is the hard gate. If this fails, stop the migration.']
  },
  {
    id: 'build-chain',
    title: 'A distributable macOS build can be produced',
    status: 'pending',
    required: false,
    notes: ['Validate packaging early enough to avoid a late surprise.']
  }
]

export const requiredTargetIds = validationTargets.filter((target) => target.required).map((target) => target.id)
