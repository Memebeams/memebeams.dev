export interface Bounty {
  target: string;
  reference?: string;
  authorId?: string;
  winnerId?: string;
  due: number;
  posted: number;
}
