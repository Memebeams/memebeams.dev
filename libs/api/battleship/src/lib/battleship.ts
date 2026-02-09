import exp = require('constants');
import { Express } from 'express';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';

export interface Team {
  id: string;
  name: string;
  password: string;
  token: string;
  adminPassword: string;
  adminToken: string;
}

export interface Board {
  width: number;
  height: number;
  cells: Cell[];
  ships: { [key in ShipType]: number };
}

export interface TeamBoard {
  ships: { [id: string]: TeamShip };
}

export interface Cell {
  x: number;
  y: number;
  src: string;
  description: string;
  rarity: string;
}

export enum ShipType {
  Plus = 'plus',
  Line = 'line',
  C = 'c',
  T = 't',
  P = 'p',
  L = 'l',
}

export interface Ship {
  squares: ShipSquare[][];
}

export interface TeamShip extends Ship {
  id: string;
  coords?: { x: number; y: number };
}

export interface ShipSquare {
  included: boolean;
}

export interface BattleshipData {
  eventPassword: string;
  teams: Team[];
  board: Board;
  shipTypes: { [key in ShipType]: Ship };
  teamBoards: { [teamId: string]: TeamBoard };
}

export class Battleship {
  // TODO: Config support
  public readonly config = {
    dataPath: '/var/data',
  };

  private data: BattleshipData;

  public async load() {
    const file = path.join(this.config.dataPath, '/battleship.json');
    console.info('Looking for battleship file at:', file);
    if (!existsSync(file)) return;
    const battleshipJson = await readFile(file);
    this.data = JSON.parse(battleshipJson.toString());
  }

  public async save(data: BattleshipData) {
    const file = path.join(this.config.dataPath, '/battleship.json');
    await writeFile(file, JSON.stringify(data, null, 2));
    this.data = data;
  }

  public login(app: Express) {
    app.post('/api/battleship/login', async (req, res) => {
      const { password } = req.body;
      if (!password) {
        return res.status(400).send('Missing password');
      }

      if (password === this.data.eventPassword) {
        const eventToken = process.env['SYNC_KEY'] || '';
        return res.status(200).json({ token: eventToken, isAdmin: true });
      }

      const team = this.data.teams.find(
        (t) => t.password === password || t.adminPassword === password
      );
      if (!team) {
        return res.status(403).send('Invalid password');
      }

      const isCaptain = team.adminPassword === password;

      return res
        .status(200)
        .json({ token: isCaptain ? team.adminToken : team.token, isCaptain });
    });
  }

  public getBoard(app: Express) {
    app.get('/api/battleship/board', async (req, res) => {
      const token = req.headers['token'];
      if (!token || typeof token !== 'string') {
        return res.status(401).send('Missing token');
      }

      if (token === process.env['SYNC_KEY']) {
        const board = this.data.board;
        const shipTypes = this.data.shipTypes;
        return res.status(200).json({ board, shipTypes });
      }

      const team = this.data.teams.find(
        (t) => t.token === token || t.adminToken === token
      );
      if (!team) {
        return res.status(403).send('Invalid token');
      }

      const board = this.data.board;
      const teamBoard = this.data.teamBoards[team.id];
      const shipTypes = this.data.shipTypes;
      return res.status(200).json({ board, teamBoard, shipTypes });
    });
  }

  public uploadData(app: Express) {
    app.post('/api/battleship/admin/upload', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid key');
      }

      const battleshipData: BattleshipData = req.body;
      await this.save(battleshipData);
      return res.status(200).send('Data saved');
    });
  }

  public updateCell(app: Express) {
    app.put('/api/battleship/admin/cell', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid token');
      }

      const cell: Cell = req.body;
      if (cell.x === undefined || cell.y === undefined) {
        return res.status(400).send('Missing cell coordinates');
      }

      if (
        cell.x < 0 ||
        cell.x >= this.data.board.width ||
        cell.y < 0 ||
        cell.y >= this.data.board.height
      ) {
        return res.status(400).send('Cell coordinates out of bounds');
      }

      this.data.board.cells[cell.y][cell.x] = cell;
      this.save(this.data);
      return res.status(200).send(cell);
    });
  }

  public updateShip(app: Express) {
    app.put('/api/battleship/ship', async (req, res) => {
      const token = req.headers['token'];
      if (!token || typeof token !== 'string') {
        return res.status(401).send('Missing token');
      }

      const team = this.data.teams.find((t) => t.adminToken === token);
      if (!team) {
        return res.status(403).send('Invalid token');
      }

      const board = this.data.teamBoards[team.id];
      if (!board) {
        return res.status(404).send('Team board not found');
      }

      if (!req.body.id) {
        return res.status(400).send('Missing ship ID');
      }

      this.data.teamBoards[team.id] = {
        ...board,
        ships: {
          ...board.ships,
          [req.body.id]: req.body,
        },
      };
      this.save(this.data);
      return res.status(200).send(req.body);
    });
  }
}

export async function battleship(app: Express) {
  const battleship = new Battleship();
  await battleship.load();

  battleship.login(app);
  battleship.getBoard(app);
  battleship.uploadData(app);
  battleship.updateCell(app);
  battleship.updateShip(app);
}
