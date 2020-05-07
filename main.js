// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, Menu, MenuItem } = require('electron')
const path = require('path')
const fs = require('fs')
const ProgressBar = require('electron-progressbar');
var progressBar
var firstURL = "get_keys.html"
var validator = require('validator')
let mainWindow
const config_path = path.join(__dirname, '../config.js')


let mainMenu = Menu.buildFromTemplate([
  {
    label: "Pixel",
    submenu: [
      {
        label: "Start New",
        click: () => {
          const data = fs.readFileSync(config_path,
            { encoding: 'utf8', flag: 'r' });

          !validator.isEmpty(data) ? mainWindow.loadFile("index.html") : mainWindow.loadFile("get_keys.html")

        },
      },
      {
        label: "Pixel Github Repo",
        click: () => { mainWindow.loadURL("https://github.com/singhvbv/Pixel") },
      },
      {
        label: "Change API Key",
        accelerator: "Shift+CommandOrControl+C",
        click: () => { mainWindow.loadFile("get_keys.html") },
      },
      {
        label: "Unsplash",
        submenu: [
          {
            label: "Know about Unsplash",
            click: () => { mainWindow.loadURL("https://unsplash.com/") },
          },
          {
            label: "Get Unsplash Access Key",
            accelerator: "Shift+CommandOrControl+U",
            click: () => { mainWindow.loadURL("https://unsplash.com/developers") },
          },
        ]
      },
      {
        label: "Pexel",
        submenu: [
          {
            label: "Know about Pexel",
            click: () => { mainWindow.loadURL("https://www.pexels.com") },
          },
          {
            label: "Get Pexel API Key",
            accelerator: "Shift+CommandOrControl+P",
            click: () => { mainWindow.loadURL("https://www.pexels.com/api/?locale=en-US") },
          },
        ]
      },
      {
        label: "Exit",
        accelerator: "Shift+CommandOrControl+E",
        role: "quit",
      },

    ]

  }

])

function createWindow() {


  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true

    },
    show: false,
    backgroundColor: '#ebebeb',
    icon: "icon.png",

  })



  //hide default menu
  mainWindow.setMenu(mainMenu)


  // Create the loader window. //Splash Screen 
  const loaderWindow = new BrowserWindow({
    width: 970,
    height: 550,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    backgroundColor: '#000000',
    alwaysOnTop: true,
    resizable: false,
    fullscreenable: false,


  })



  // load the splashscreen
  loaderWindow.loadFile('splash.html')
  let lwc = loaderWindow.webContents

  lwc.on('dom-ready', () => {

    //This will check if api keys are
    //properly set 

    if (!fs.existsSync(config_path)) {
      const createStream = fs.createWriteStream(config_path);
      createStream.end();
    }

    const data = fs.readFileSync(config_path,
      { encoding: 'utf8', flag: 'r' });


    if (!validator.isEmpty(data)) firstURL = "index.html"


  })

  lwc.on('did-finish-load', () => {


    //show splash 
    loaderWindow.show()


    // and load the index.html of the app.
    mainWindow.loadFile(firstURL)
  })

  mainWindow.on('ready-to-show', () => {

    setTimeout(() => {
      //destroy splash start mainwindow


      loaderWindow.destroy()
      mainWindow.show()


    }, 3100)

  })


  //Initializing progressBar for downloads 
  ipcMain.on('init-progress', (event, arg) => {
    init_progress(arg)
  })

  //Incrementing progressBar Value for task completion
  ipcMain.on('progress_increment', (event, arg) => {
    progressBar.value += 100 / arg;

    if (progressBar.value > 99.8) progressBar.value = 100

  })

  //progressBar method
  function init_progress() {

    progressBar = new ProgressBar({
      indeterminate: false,
      browserWindow: {

        text: 'Preparing downloads...',
        detail: 'Wait...',
        webPreferences: {
          nodeIntegration: true
        }
      }
    })


    progressBar
      .on('completed', function () {
        console.info(`completed...`);
        progressBar.detail = 'Download completed. Exiting...';
        mainWindow.loadFile('completion.html')

      })
      .on('aborted', function (value) {
        console.info(`aborted... ${value}`);
        mainWindow.loadFile('incomplete.html')
      })
      .on('progress', function (value) {
        progressBar.detail = `Download Progess ...`;
      });

  }


  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
