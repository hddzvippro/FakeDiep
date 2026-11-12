/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import express, { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './server/game-engine.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startStandalone() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Initialize Game Manager
  const gameManager = GameManager.getInstance();

  // Attach WebSockets
  const wss = new WebSocketServer({ server });
  wss.on('connection', (ws) => {
    gameManager.handleConnection(ws);
  });

  // REST API routes
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json(gameManager.getRoomStats());
  });

  // Find dist directory
  const possiblePaths = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, 'dist'),
    path.join(path.dirname(process.execPath), 'dist'),
  ];

  let distPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];

  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.send(`
        <html>
          <body style="background:#020617;color:white;font-family:sans-serif;text-align:center;padding:50px;">
            <h1>Arras.io Tank Arena</h1>
            <p>Game server is running on port ${PORT}.</p>
          </body>
        </html>
      `);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    const url = `http://localhost:${PORT}`;
    console.log(`
======================================================================
   ARRAS.IO 2D TANK ARENA - WINDOWS EDITION
======================================================================
* Game server da khoi dong thanh cong tai: ${url}
* Dang tu dong mo trinh duyet web cua ban...
* Ban co the mo nhieu tab tren trinh duyet de ban nhau cung luc!
* De thoat game: Dong cua so console nay hoac nhan Ctrl + C
======================================================================
`);

    // Auto-open browser
    const platform = process.platform;
    if (platform === 'win32') {
      exec(`start ${url}`);
    } else if (platform === 'darwin') {
      exec(`open ${url}`);
    } else {
      exec(`xdg-open ${url}`);
    }
  });
}

startStandalone().catch((err) => {
  console.error('Loi khoi dong server:', err);
});
