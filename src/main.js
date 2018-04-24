const electron = require('electron');
// Module to control application life.
const app = electron.app;
// Module to create native browser window.

const IndexWindow = require('./windows/controllers/index');
const RollWindow = require('./windows/controllers/roll');


class RollTool {
    constructor() {
        this.indexWindow = null;
        this.rollWindow = null;
    }

    init() {
        this.initApp()
    }

    initApp() {
        app.on('ready', () => {
            this.indexWindow = new IndexWindow();
            this.rollWindow = new RollWindow();
        });
        app.on('activate', () => {
            // On OS X it's common to re-create a window in the app when the
            // dock icon is clicked and there are no other windows open.
            if (this.indexWindow === null) {
                this.indexWindow = new IndexWindow();
            }
            if (this.rollWindow === null) {
                this.rollWindow = new RollWindow();
            }
        });

        // Quit when all windows are closed.
        app.on('window-all-closed', function () {
            // On OS X it is common for applications and their menu bar
            // to stay active until the user quits explicitly with Cmd + Q
            if (process.platform !== 'darwin') {
                app.quit()
            }
        })
    }
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.


new RollTool().init();


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
