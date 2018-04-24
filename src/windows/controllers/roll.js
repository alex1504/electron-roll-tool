const path = require('path');
const {BrowserWindow} = require('electron');
const url = require('url');


class RollWindow {
    constructor() {
        // Create the browser window.
        this.rollWindow = new BrowserWindow({
            width: 1200, height: 800, show: false
        })

        // and load the index.html of the app.
        this.rollWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../', 'views', 'roll', 'index.html'),
            protocol: 'file:',
            slashes: true
        }))

        // Emitted when the window is closed.
        this.rollWindow.on('closed', () => {
            this.rollWindow = null
        })
    }
}

module.exports = RollWindow;