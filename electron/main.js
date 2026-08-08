const { app, BrowserWindow, shell, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');
const http = require('http');

let mainWindow = null;
let serverProcess = null;

// Find a free port starting from a default
function findFreePort(startPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => {
                resolve(port);
            });
        });
        server.on('error', () => {
            resolve(findFreePort(startPort + 1));
        });
    });
}

// Wait for the backend server to be responsive
function waitForServer(port) {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            const req = http.get(`http://localhost:${port}/api/files/list`, (res) => {
                clearInterval(interval);
                resolve(true);
            });
            req.on('error', () => {
                // Ignore and retry
            });
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(interval);
            resolve(false);
        }, 10000);
    });
}

async function startServer(port) {
    // Look for server.cjs in multiple potential paths (dev and packaged)
    let serverPath = '';
    const pathsToTry = [
        path.join(__dirname, '..', 'app', 'dist', 'server.cjs'),
        path.join(__dirname, 'app', 'dist', 'server.cjs'),
        path.join(process.resourcesPath, 'app', 'dist', 'server.cjs'),
        path.join(process.resourcesPath, 'app.asar', 'app', 'dist', 'server.cjs'),
    ];

    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            serverPath = p;
            break;
        }
    }

    if (!serverPath) {
        console.error('Could not find server.cjs in any of the paths:', pathsToTry);
        return false;
    }

    // Set user data path to Documents/MathBookData
    const userDataPath = path.join(app.getPath('documents'), 'MathBookData');
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    console.log(`Launching server from: ${serverPath}`);
    console.log(`Using data directory: ${userDataPath}`);

    // Launch the server using Electron's utilityProcess (in-process Node helper, robust across OSes)
    if (utilityProcess) {
        serverProcess = utilityProcess.fork(serverPath, [], {
            env: {
                ...process.env,
                PORT: String(port),
                MATHBOOK_PORT: String(port),
                MATHBOOK_DATA_DIR: userDataPath,
                NODE_ENV: 'production'
            },
            stdio: 'inherit'
        });
    } else {
        // Fallback to standard child_process spawn
        const { spawn } = require('child_process');
        serverProcess = spawn(process.execPath, [serverPath], {
            env: {
                ...process.env,
                PORT: String(port),
                MATHBOOK_PORT: String(port),
                MATHBOOK_DATA_DIR: userDataPath,
                NODE_ENV: 'production',
                ELECTRON_RUN_AS_NODE: '1'
            },
            stdio: 'inherit'
        });
    }

    return true;
}

async function createWindow() {
    const port = await findFreePort(3000);
    const serverStarted = await startServer(port);

    if (serverStarted) {
        await waitForServer(port);
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'MathBook',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    // Load the local running server
    mainWindow.loadURL(`http://localhost:${port}`);

    // Open external links in the default browser instead of inside Electron
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    // Terminate server process when electron window is closed
    if (serverProcess) {
        if (serverProcess.kill) {
            serverProcess.kill();
        } else if (serverProcess.terminate) {
            serverProcess.terminate();
        }
    }

    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
