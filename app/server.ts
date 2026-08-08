import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = process.env.MATHBOOK_PORT ? parseInt(process.env.MATHBOOK_PORT, 10) : 3000;

// Resolve paths
const DATA_ROOT = process.env.MATHBOOK_DATA_DIR 
    ? path.resolve(process.env.MATHBOOK_DATA_DIR)
    : path.resolve(process.cwd(), '../data');
const TRASH_DIR = path.join(DATA_ROOT, '.trash');

// Ensure data and trash dirs exist
if (!fs.existsSync(DATA_ROOT)) fs.mkdirSync(DATA_ROOT, { recursive: true });
if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true });

// Create some default files in DATA_ROOT if empty so the user starts with something
const testFile = path.join(DATA_ROOT, 'Untitled.nb');
if (!fs.existsSync(testFile)) {
    const defaultNotebook = {
        meta: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            mathbook_version: "3",
        },
        cells: [
            {
                id: Math.random().toString(36).substring(2, 11),
                cellType: 'markdown',
                code: '# Welcome to MathBook\nThis is an interactive reactive math notebook environment.\n\nDouble click cells to edit and use standard mathematical expressions.\n\nEnjoy!',
                result: null,
                error: null,
                type: null
            },
            {
                id: Math.random().toString(36).substring(2, 11),
                cellType: 'code',
                varName: 'x',
                code: 'x = 10',
                result: '10',
                error: null,
                type: 'number'
            },
            {
                id: Math.random().toString(36).substring(2, 11),
                cellType: 'code',
                varName: 'y',
                code: 'y = x * 2 + 5',
                result: '25',
                error: null,
                type: 'number'
            }
        ],
        activeCellId: null,
    };
    fs.writeFileSync(testFile, JSON.stringify(defaultNotebook, null, 2), 'utf8');
}

app.use(cors());
app.use(express.json());

// Helpers
function safePath(relativePath: string) {
    const resolved = path.resolve(DATA_ROOT, relativePath || '');
    if (!resolved.startsWith(DATA_ROOT)) return null;
    return resolved;
}

function getEntryInfo(fullPath: string, name: string) {
    try {
        const stat = fs.statSync(fullPath);
        const isDir = stat.isDirectory();
        const ext = isDir ? null : path.extname(name).toLowerCase();
        return {
            name,
            isDirectory: isDir,
            extension: ext,
            size: isDir ? null : stat.size,
            modified: stat.mtime.toISOString(),
            created: stat.birthtime.toISOString(),
        };
    } catch {
        return null;
    }
}

// API Routes

// 1. GET /api/files/list — List directory contents
app.get('/api/files/list', (req, res) => {
    const reqPath = (req.query.path as string) || '';
    const dirPath = safePath(reqPath);
    if (!dirPath) return res.status(400).json({ error: 'Invalid path' });

    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
        return res.status(404).json({ error: 'Directory not found' });
    }

    const entries = fs.readdirSync(dirPath)
        .filter(name => !name.startsWith('.'))  // hide dotfiles
        .map(name => getEntryInfo(path.join(dirPath, name), name))
        .filter(Boolean)
        .sort((a: any, b: any) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

    res.json({ path: reqPath, entries });
});

// 2. POST /api/files/folder — Create a new folder
app.post('/api/files/folder', (req, res) => {
    const { path: relPath, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const parentDir = safePath(relPath || '');
    if (!parentDir) return res.status(400).json({ error: 'Invalid path' });

    const folderPath = path.join(parentDir, name);
    if (fs.existsSync(folderPath)) {
        return res.status(409).json({ error: 'Folder already exists' });
    }

    fs.mkdirSync(folderPath, { recursive: true });
    res.json({ success: true, name });
});

// 3. POST /api/notebooks — Create a new empty .nb file
app.post('/api/notebooks', (req, res) => {
    const { path: relPath, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const fileName = name.endsWith('.nb') ? name : `${name}.nb`;

    const parentDir = safePath(relPath || '');
    if (!parentDir) return res.status(400).json({ error: 'Invalid path' });

    const filePath = path.join(parentDir, fileName);
    if (fs.existsSync(filePath)) {
        return res.status(409).json({ error: 'File already exists' });
    }

    const emptyNotebook = {
        meta: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            mathbook_version: "3",
        },
        cells: [
            {
                id: Math.random().toString(36).substring(2, 11),
                cellType: 'code',
                varName: '_' + Math.random().toString(16).substring(2, 8),
                code: '',
                result: null,
                error: null,
                type: null,
            },
        ],
        activeCellId: null,
    };

    fs.writeFileSync(filePath, JSON.stringify(emptyNotebook, null, 2), 'utf8');
    res.json({ success: true, name: fileName });
});

// 4. PUT /api/files/rename — Rename a file or folder
app.put('/api/files/rename', (req, res) => {
    const { path: relPath, oldName, newName } = req.body;
    if (!oldName || !newName) return res.status(400).json({ error: 'Names required' });

    const parentDir = safePath(relPath || '');
    if (!parentDir) return res.status(400).json({ error: 'Invalid path' });

    const oldPath = path.join(parentDir, oldName);
    const newPath = path.join(parentDir, newName);

    if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Not found' });
    if (fs.existsSync(newPath)) return res.status(409).json({ error: 'Name already in use' });

    fs.renameSync(oldPath, newPath);
    res.json({ success: true });
});

// 5. DELETE /api/files — Move to .trash
app.delete('/api/files', (req, res) => {
    const { path: relPath, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const parentDir = safePath(relPath || '');
    if (!parentDir) return res.status(400).json({ error: 'Invalid path' });

    const sourcePath = path.join(parentDir, name);
    if (!fs.existsSync(sourcePath)) return res.status(404).json({ error: 'Not found' });

    const trashName = `${Date.now()}_${name}`;
    const trashPath = path.join(TRASH_DIR, trashName);

    fs.renameSync(sourcePath, trashPath);
    res.json({ success: true });
});

// 6. GET /api/notebooks?path= — Read a .nb file
app.get('/api/notebooks', (req, res) => {
    const reqPath = (req.query.path as string) || '';
    const filePath = safePath(reqPath);
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read notebook' });
    }
});

// 7. PUT /api/notebooks — Save a .nb file
app.put('/api/notebooks', (req, res) => {
    const { path: relPath, data } = req.body;
    const filePath = safePath(relPath || '');
    if (!filePath) return res.status(400).json({ error: 'Invalid path' });

    if (data && data.meta) {
        data.meta.modified = new Date().toISOString();
    }

    const tmpPath = filePath + '.tmp';
    try {
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf8');
        fs.renameSync(tmpPath, filePath);
        res.json({ success: true, modified: data?.meta?.modified });
    } catch (err) {
        try { fs.unlinkSync(tmpPath); } catch { }
        res.status(500).json({ error: 'Failed to save notebook' });
    }
});

// Vite integration
async function start() {
    if (process.env.NODE_ENV !== "production") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

start();
