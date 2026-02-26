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
  cells: Cell[][];
  ships: { [key in ShipType]: number };
}

export interface TeamBoard {
  ships: { [id: string]: TeamShip };
  attacks: Record<string, Attack>;
}

export interface TeamBoardResponse {
  ships: { [id: string]: TeamShip };
  enemyShipsSunk: { [id: string]: TeamShip };
  attacksOnTeam: Record<string, Attack>;
  attacksByTeam: Record<string, Attack>;
}

export interface AdminTeamBoardResponse {
  ships: { [id: string]: TeamShip };
  attacksByTeam: Record<string, Attack>;
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
  Z = 'z',
}

export interface Ship {
  squares: ShipSquare[][];
}

export interface TeamShip extends Ship {
  id: string;
  rotation: 0 | 1 | 2 | 3;
  coords?: { x: number; y: number };
  hits?: Record<string, Attack>;
}

export interface ShipSquare {
  included: boolean;
  center?: boolean;
}

export interface Attack {
  x: number;
  y: number;
  rsn: string;
  hit?: boolean;
}

export interface AdminAttack extends Attack {
  attackingTeam: string;
}

export interface AttackResponse {
  attack: Attack;
  enemyShipsSunk: { [id: string]: TeamShip };
}

export interface BattleshipData {
  eventPassword: string;
  cutOffDate: string;
  hitSrc: string;
  missSrc: string;
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
      if (
        !token ||
        typeof token !== 'string' ||
        token === process.env['SYNC_KEY']
      ) {
        return this.getAdminBoard(res);
      }

      const team = this.data.teams.find(
        (t) => t.token === token || t.adminToken === token
      );
      if (!team) {
        return res.status(403).send('Invalid token');
      }
      const isCaptain = team.adminToken === token;

      const otherTeam = this.data.teams.find((t) => t.id !== team.id);
      if (!otherTeam) {
        return res.status(404).send('Other team not found');
      }

      const board = this.data.board;
      const teamBoard = this.data.teamBoards[team.id];
      const otherTeamBoard = this.data.teamBoards[otherTeam.id];
      const shipTypes = this.data.shipTypes;
      const hitSrc = this.data.hitSrc;
      const missSrc = this.data.missSrc;

      const ships = this.withHits(teamBoard.ships, otherTeamBoard.attacks);
      const enemyShips = this.withHits(otherTeamBoard.ships, teamBoard.attacks);

      const enemyShipsSunk = this.filterBySunkStatus(enemyShips, true);

      let allyShipsNotSunk = this.filterBySunkStatus(ships, false);
      const allyShipsSunk = this.filterBySunkStatus(ships, true);

      let shipsToReturn = {
        ...allyShipsSunk,
      };

      if (isCaptain) {
        shipsToReturn = {
          ...allyShipsNotSunk,
          ...allyShipsSunk,
        };
      }

      const teamBoardResponse: TeamBoardResponse = {
        ships: shipsToReturn,
        enemyShipsSunk,
        attacksByTeam: teamBoard.attacks,
        attacksOnTeam: otherTeamBoard.attacks,
      };

      return res.status(200).json({
        board,
        teamBoard: teamBoardResponse,
        shipTypes,
        hitSrc,
        missSrc,
      });
    });
  }

  private getAdminBoard(res: any) {
    const board = this.data.board;
    const shipTypes = this.data.shipTypes;
    const teamBoards = this.data.teams.reduce((acc, team) => {
      const teamBoard = this.data.teamBoards[team.id];
      if (teamBoard) {
        const teamBoardResponse: AdminTeamBoardResponse = {
          ships: this.withHits(teamBoard.ships, teamBoard.attacks),
          attacksByTeam: teamBoard.attacks,
        };
        acc[team.id] = teamBoardResponse;
      }
      return acc;
    }, {} as { [teamId: string]: AdminTeamBoardResponse });
    return res.status(200).json({ board, shipTypes, teamBoards });
  }

  private withHits(
    ships: { [id: string]: TeamShip },
    attacks: Record<string, Attack>
  ) {
    if (!attacks) return ships;
    const shipsWithHits: { [id: string]: TeamShip } = { ...ships };
    Object.values(shipsWithHits).forEach((ship) => {
      if (!ship.coords) return;

      const squares = rotateSquares(ship.squares, ship.rotation);
      const center = getCenter(squares);

      const shipWithHits = { ...ship, hits: {} };
      for (const [rowIndex, row] of squares.entries()) {
        for (const [colIndex, square] of row.entries()) {
          if (!square.included) continue;

          const cellCoords = {
            x: ship.coords.x - center.x + colIndex,
            y: ship.coords.y - center.y + rowIndex,
          };

          const attack = attacks[getCellKey(cellCoords)];
          if (attack) {
            const key = getCellKey({ x: colIndex, y: rowIndex });
            shipWithHits.hits = {
              ...shipWithHits.hits,
              [key]: attack,
            };
          }
        }
      }

      shipsWithHits[ship.id] = shipWithHits;
    });
    return shipsWithHits;
  }

  private filterBySunkStatus(ships: { [id: string]: TeamShip }, sunk: boolean) {
    const filtered: { [id: string]: TeamShip } = { ...ships };
    const shouldDelete = (squareCount: number, hitCount: number) => {
      const isSunk = hitCount === squareCount;
      return sunk ? !isSunk : isSunk;
    };

    Object.keys(filtered).forEach((shipId) => {
      const ship = filtered[shipId];
      const squareCount = ship.squares.reduce(
        (count, row) => count + row.filter((sq) => sq.included).length,
        0
      );
      const hitCount = ship.hits ? Object.keys(ship.hits).length : 0;
      if (shouldDelete(squareCount, hitCount)) {
        delete filtered[shipId];
      }
    });
    return filtered;
  }

  public uploadData(app: Express) {
    app.put('/api/battleship/admin/data', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid key');
      }

      const battleshipData: BattleshipData = req.body;
      await this.save(battleshipData);
      return res.status(200).send('Data saved');
    });
  }

  public getData(app: Express) {
    app.get('/api/battleship/admin/data', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid key');
      }

      return res.status(200).json(this.data);
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

      if (this.data.cutOffDate) {
        const cutOffDate = new Date(this.data.cutOffDate);
        if (new Date() > cutOffDate) {
          return res.status(403).send('Event has already started');
        }
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

  public attack(app: Express) {
    app.post('/api/battleship/attack', async (req, res) => {
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
      const otherTeam = this.data.teams.find((t) => t.id !== team.id);
      if (!otherTeam) {
        return res.status(404).send('Other team not found');
      }

      const attack: Attack = req.body;
      if (attack.x === undefined || attack.y === undefined || !attack.rsn) {
        return res.status(400).send('Missing attack data');
      }

      if (this.data.cutOffDate) {
        const cutOffDate = new Date(this.data.cutOffDate);
        if (new Date() < cutOffDate) {
          return res.status(403).send('Event has not started yet');
        }
      }

      attack.hit = this.isCellOccupied(attack, otherTeam.id);

      if (!board.attacks) {
        board.attacks = {};
      }
      board.attacks[getCellKey(attack)] = attack;
      this.save(this.data);

      const ships = this.withHits(this.data.teamBoards[otherTeam.id].ships, {
        ...board.attacks,
        [getCellKey(attack)]: attack,
      });

      // Try this change to avoid computing hits on get
      // this.data.teamBoards[otherTeam.id].ships = ships;
      // this.save(this.data);

      const response: AttackResponse = {
        attack,
        enemyShipsSunk: this.filterBySunkStatus(ships, true),
      };

      return res.status(200).send(response);
    });
  }

  public adminAttack(app: Express) {
    app.post('/api/battleship/admin/attack', async (req, res) => {
      const token = req.headers['token'];
      if (!token || typeof token !== 'string') {
        return res.status(401).send('Missing token');
      }

      if (token !== process.env['SYNC_KEY']) {
        return res.status(403).send('Invalid token');
      }

      const attack: AdminAttack = req.body;
      if (!attack.attackingTeam) {
        return res.status(400).send('Missing attacking team');
      }

      const team = this.data.teams.find((t) => t.id === attack.attackingTeam);
      if (!team) {
        return res.status(404).send('Attacking team not found');
      }

      const board = this.data.teamBoards[team.id];
      if (!board) {
        return res.status(404).send('Team board not found');
      }

      const otherTeam = this.data.teams.find((t) => t.id !== team.id);
      if (!otherTeam) {
        return res.status(404).send('Other team not found');
      }

      if (attack.x === undefined || attack.y === undefined || !attack.rsn) {
        return res.status(400).send('Missing attack data');
      }

      attack.hit = this.isCellOccupied(attack, otherTeam.id);

      if (!board.attacks) {
        board.attacks = {};
      }
      delete attack.attackingTeam;
      board.attacks[getCellKey(attack)] = attack;
      this.save(this.data);

      const ships = this.withHits(this.data.teamBoards[otherTeam.id].ships, {
        ...board.attacks,
        [getCellKey(attack)]: attack,
      });

      // Try this change to avoid computing hits on get
      // this.data.teamBoards[otherTeam.id].ships = ships;
      // this.save(this.data);

      const response: AttackResponse = {
        attack,
        enemyShipsSunk: this.filterBySunkStatus(ships, true),
      };

      return res.status(200).send(response);
    });
  }

  public clearAttack(app: Express) {
    app.delete('/api/battleship/admin/attack', async (req, res) => {
      const token = req.headers['token'];
      if (!token || typeof token !== 'string') {
        return res.status(401).send('Missing token');
      }

      if (token !== process.env['SYNC_KEY']) {
        return res.status(403).send('Invalid token');
      }

      const { x, y, teamId } = req.body;
      if (x === undefined || y === undefined || !teamId) {
        return res.status(400).send('Missing attack data');
      }

      const teamBoard = this.data.teamBoards[teamId];
      if (!teamBoard) {
        return res.status(404).send('Team board not found');
      }

      delete teamBoard.attacks[getCellKey({ x, y })];
      this.save(this.data);
      return res.status(200).send('Attack cleared');
    });
  }

  public isCellOccupied({ x, y }: { x: number; y: number }, teamId: string) {
    const teamBoard = this.data.teamBoards[teamId];
    if (!teamBoard) return false;

    const teamShips = Object.values(teamBoard.ships);
    for (const ship of teamShips) {
      if (!ship.coords) continue;
      const squares = rotateSquares(ship.squares, ship.rotation);
      const center = getCenter(squares);

      for (let rowIndex = 0; rowIndex < squares.length; rowIndex++) {
        for (
          let colIndex = 0;
          colIndex < squares[rowIndex].length;
          colIndex++
        ) {
          if (!squares[rowIndex][colIndex].included) continue;
          const cellX = ship.coords.x + colIndex - center.x;
          const cellY = ship.coords.y + rowIndex - center.y;
          if (cellX === x && cellY === y) {
            return true;
          }
        }
      }
    }

    return false;
  }

  public shuffle(app: Express) {
    app.post('/api/battleship/admin/shuffle', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid token');
      }

      if (this.data.cutOffDate) {
        const cutOffDate = new Date(this.data.cutOffDate);
        if (new Date() > cutOffDate) {
          return res.status(403).send('Event has already started');
        }
      }

      let flattened = this.data.board.cells.flat();
      flattened = flattened.sort(() => Math.random() - 0.5);
      const newCells: Cell[][] = [];
      for (let i = 0; i < this.data.board.height; i++) {
        const row = [];
        for (let j = 0; j < this.data.board.width; j++) {
          const cell = flattened[i * this.data.board.width + j];
          row.push({ ...cell, x: j, y: i });
        }
        newCells.push(row);
      }

      this.data.board.cells = newCells;
      this.save(this.data);
      return res.status(200).send({ board: this.data.board });
    });
  }

  public reset(app: Express) {
    app.post('/api/battleship/admin/reset', async (req, res) => {
      const key = req.headers['token'];
      if (key !== process.env['SYNC_KEY']) {
        return res.status(401).send('Invalid token');
      }

      for (const teamBoard of Object.values(this.data.teamBoards)) {
        teamBoard.ships = {};
        teamBoard.attacks = {};
      }

      this.save(this.data);
      return res.status(200).send('Game reset');
    });
  }
}

export async function battleship(app: Express) {
  const battleship = new Battleship();
  await battleship.load();

  battleship.login(app);
  battleship.getBoard(app);
  battleship.uploadData(app);
  battleship.getData(app);
  battleship.updateCell(app);
  battleship.updateShip(app);
  battleship.attack(app);
  battleship.shuffle(app);
  battleship.reset(app);
  battleship.clearAttack(app);
  battleship.adminAttack(app);
}

export function getCellKey({ x, y }: { x: number; y: number }) {
  return `${x},${y}`;
}

export function rotateSquares(
  squares: ShipSquare[][],
  rotation: 0 | 1 | 2 | 3
): ShipSquare[][] {
  // Rotate the 2D array squares by 90 * rotation degrees
  const numRows = squares.length;
  const numCols = squares[0]?.length || 0;

  if (rotation === 0) {
    return squares;
  }

  const rotated: ShipSquare[][] = [];

  if (rotation === 1) {
    // 90 degrees clockwise
    for (let col = 0; col < numCols; col++) {
      rotated[col] = [];
      for (let row = numRows - 1; row >= 0; row--) {
        rotated[col].push(squares[row][col]);
      }
    }
  } else if (rotation === 2) {
    // 180 degrees
    for (let row = numRows - 1; row >= 0; row--) {
      rotated.push([...squares[row]].reverse());
    }
  } else if (rotation === 3) {
    // 270 degrees clockwise (or 90 degrees counterclockwise)
    for (let col = numCols - 1; col >= 0; col--) {
      rotated[numCols - 1 - col] = [];
      for (let row = 0; row < numRows; row++) {
        rotated[numCols - 1 - col].push(squares[row][col]);
      }
    }
  }

  return rotated;
}

export function getCenter(squares: ShipSquare[][]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  for (let rowIndex = 0; rowIndex < squares.length; rowIndex++) {
    for (let colIndex = 0; colIndex < squares[rowIndex].length; colIndex++) {
      if (squares[rowIndex][colIndex].center) {
        return {
          x: colIndex,
          y: rowIndex,
          width: squares[0].length,
          height: squares.length,
        };
      }
    }
  }
  return { x: 0, y: 0, width: 0, height: 0 };
}
