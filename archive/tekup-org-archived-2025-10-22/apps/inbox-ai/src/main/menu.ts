/**
 * Application menu setup for AI IMAP Inbox
 */

import { Menu, MenuItem, shell, app } from 'electron'

export interface MenuOptions {
  isDev: boolean
  onAbout: () => void
  onPreferences: () => void
  onQuit: () => void
}

export function createApplicationMenu(options: MenuOptions): Menu {
  const { isDev, onAbout, onPreferences, onQuit } = options

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Email',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Will be handled by renderer process
          }
        },
        {
          label: 'Add Email Account',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            // Will be handled by renderer process
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: onPreferences
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: onQuit
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Email',
      submenu: [
        {
          label: 'Sync All Accounts',
          accelerator: 'F5',
          click: () => {
            // Will be handled by renderer process
          }
        },
        {
          label: 'Mark All as Read',
          accelerator: 'CmdOrCtrl+Shift+A',
          click: () => {
            // Will be handled by renderer process
          }
        },
        { type: 'separator' },
        {
          label: 'Search Emails',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            // Will be handled by renderer process
          }
        }
      ]
    },
    {
      label: 'AI',
      submenu: [
        {
          label: 'Summarize Selected Email',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            // Will be handled by renderer process
          }
        },
        {
          label: 'Categorize Emails',
          accelerator: 'CmdOrCtrl+Shift+C',
          click: () => {
            // Will be handled by renderer process
          }
        },
        {
          label: 'Extract Action Items',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => {
            // Will be handled by renderer process
          }
        },
        { type: 'separator' },
        {
          label: 'AI Settings',
          click: () => {
            // Will be handled by renderer process - show AI settings tab
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About AI IMAP Inbox',
          click: onAbout
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://github.com/your-username/ai-imap-inbox#readme')
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/your-username/ai-imap-inbox/issues')
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            // Will trigger auto-updater check
          }
        }
      ]
    }
  ]

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        {
          label: 'About ' + app.getName(),
          click: onAbout
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'Cmd+,',
          click: onPreferences
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        {
          label: 'Quit ' + app.getName(),
          accelerator: 'Cmd+Q',
          click: onQuit
        }
      ]
    })

    // Window menu for macOS
    template[template.length - 2].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ]
  }

  // Add development menu items
  if (isDev) {
    template.push({
      label: 'Development',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: (item, focusedWindow) => {
            if (focusedWindow) (focusedWindow as any).reload()
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: (item, focusedWindow) => {
            if (focusedWindow) (focusedWindow as any).webContents.toggleDevTools()
          }
        }
      ]
    })
  }

  return Menu.buildFromTemplate(template)
}