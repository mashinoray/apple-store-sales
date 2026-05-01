const { app, BrowserWindow, shell } = require('electron')
const path = require('path')
const { URL } = require('url')

// 保持对窗口对象的全局引用，避免被GC回收
let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Apple Store 销售管理系统',
    // icon: path.join(__dirname, '../public/apple-icon.ico'), // 可后续替换为自定义图标
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许访问 Supabase 等外部 API
    },
    // 现代外观
    frame: true,
    show: false, // 先隐藏，等加载完再显示（避免白屏闪烁）
    backgroundColor: '#f5f5f7',
  })

  // 加载打包后的 index.html
  const indexPath = path.join(__dirname, '../dist/index.html')
  mainWindow.loadFile(indexPath)

  // 页面加载完成后显示窗口（无闪烁）
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // 在默认浏览器中打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// 禁止多开实例
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
