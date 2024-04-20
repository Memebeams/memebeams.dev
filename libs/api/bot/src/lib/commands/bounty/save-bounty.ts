import axios from 'axios';
import { BountyFeature } from './bounty.cmd';

export class SaveBounty {
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  constructor(private readonly feature: BountyFeature) {}

  public async sync() {
    console.log(
      'Attempting put to bin ' + this.BIN_ID + ' with key ' + this.BIN_API_KEY
    );

    await axios({
      method: 'put',
      url: `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': this.BIN_API_KEY,
      },
      data: JSON.stringify(this.feature.bounty),
    });

    console.info('Bounty saved!');
  }
}
