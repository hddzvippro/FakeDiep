/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import express, { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './server/game-engine.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);

  // Initialize Game Manager singleton
  const gameManager = GameManager.getInstance();

  // Attach WebSocket Server
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

  // Download endpoints
  app.get('/api/download/html', (_req: Request, res: Response) => {
    const htmlPath = path.resolve(process.cwd(), 'arras-io-online.html');
    if (fs.existsSync(htmlPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="arras-io-online.html"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(htmlPath);
    } else {
      res.status(404).send('HTML file not found');
    }
  });

  app.get('/api/download/exe', (_req: Request, res: Response) => {
    const exePath = path.resolve(process.cwd(), 'arras-io-tank-arena.exe');
    if (fs.existsSync(exePath)) {
      res.setHeader('Content-Type', 'application/vnd.microsoft.portable-executable');
      res.setHeader('Content-Disposition', 'attachment; filename="arras-io-tank-arena.exe"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(exePath);
    } else {
      const releaseZip = path.resolve(process.cwd(), 'arras-io-windows-release.zip');
      if (fs.existsSync(releaseZip)) {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="arras-io-windows-edition.zip"');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.sendFile(releaseZip);
      } else {
        res.status(404).send('File not found');
      }
    }
  });

  app.get('/api/download/windows-release', (_req: Request, res: Response) => {
    const winZipPath = path.resolve(process.cwd(), 'arras-io-windows-release.zip');
    if (fs.existsSync(winZipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="arras-io-windows-edition.zip"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(winZipPath);
    } else {
      res.status(404).send('File not found');
    }
  });

  // Source ZIP endpoint (contains render.yaml, server.ts, src/, shared/, server/, README.md)
  app.get('/api/download-zip', (_req: Request, res: Response) => {
    const sourceZipPath = path.resolve(process.cwd(), 'arras-io-game.zip');
    if (fs.existsSync(sourceZipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="arras-io-full-source-render.zip"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(sourceZipPath);
    } else {
      res.status(404).send('File not found');
    }
  });

  app.get('/api/download/source-zip', (_req: Request, res: Response) => {
    const sourceZipPath = path.resolve(process.cwd(), 'arras-io-game.zip');
    if (fs.existsSync(sourceZipPath)) {
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="arras-io-full-source-render.zip"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(sourceZipPath);
    } else {
      res.status(404).send('File not found');
    }
  });

  app.get('/api/download/render-yaml', (_req: Request, res: Response) => {
    const renderPath = path.resolve(process.cwd(), 'render.yaml');
    if (fs.existsSync(renderPath)) {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="render.yaml"');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(renderPath);
    } else {
      res.status(404).send('render.yaml not found');
    }
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Arras.io Tank Arena server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
