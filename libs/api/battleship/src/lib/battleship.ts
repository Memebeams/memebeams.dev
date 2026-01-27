import exp = require('constants');
import { Express } from 'express';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
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
  id: string;
  squares: ShipSquare[][];
}

export interface TeamShip extends Ship {
  coords: { x: number; y: number };
}

export interface ShipSquare {
  included: boolean;
}

export interface BattleshipData {
  teams: Team[];
  board: Board;
  shipTypes: { [key in ShipType]: Ship[] };
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

  public getTeamByPassword(password: string): Team | undefined {
    return this.data.teams.find(
      (team) => team.password === password || team.adminPassword === password
    );
  }

  public getTeamByToken(token: string): Team | undefined {
    return this.data.teams.find(
      (team) => team.token === token || team.adminToken === token
    );
  }

  public getBoard(): Board {
    return this.data.board;
  }

  public getTeamBoard(teamId: string): TeamBoard | undefined {
    return this.data.teamBoards[teamId];
  }
}

export async function battleship(app: Express) {
  const battleship = new Battleship();
  await battleship.load();

  app.post('/api/battleship/login', async (req, res) => {
    const { password } = req.body;
    if (!password) {
      return res.status(400).send('Missing password');
    }

    const team = battleship.getTeamByPassword(password);
    if (!team) {
      return res.status(403).send('Invalid password');
    }

    return res.status(200).json({ token: team.token });
  });

  app.get('/api/battleship/board', async (req, res) => {
    const token = req.headers['Authorization'] || req.headers['authorization'];
    if (!token || typeof token !== 'string') {
      return res.status(401).send('Missing token');
    }

    const team = battleship.getTeamByToken(token);
    if (!team) {
      return res.status(403).send('Invalid token');
    }

    const board = battleship.getBoard();
    const teamBoard = battleship.getTeamBoard(team.id);
    return res.status(200).json({ board, teamBoard });
  });
}
