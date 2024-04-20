import axios from 'axios';
import { BountyFeature } from './bounty.cmd';

export class SaveBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  constructor(private readonly feature: BountyFeature) {}

  public async sync() {
    console.info('Saving bounty...');

    try {
      await axios({
        method: 'put',
        url: `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': this.BIN_API_KEY,
        },
        data: JSON.stringify(this.feature.bounty),
      });
    } catch (error) {
      console.error('Failed to save bounty:', error);
      return;
    }

    console.info('Bounty saved!');
  }
}
