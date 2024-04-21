import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import * as https from 'https';
import { BountyFeature } from './commands/bounty/bounty.cmd';

export class Bot {
  private readonly clientId = process.env['CLIENT_ID'];
  private readonly guildId = process.env['SERVER_ID'];
  private readonly BIN_API_KEY = process.env['BIN_API_KEY'];
  private readonly BIN_ID = process.env['BOUNTY_BIN_ID'];

  private readonly client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
  });

  private readonly rest = new REST().setToken(process.env['DISCORD_TOKEN']);

  private bounty: BountyFeature;

  async init() {
    this.client.once(Events.ClientReady, async (client) => {
      console.info(`Ready! Logged in as ${client.user.tag}.`);
      await this.setupCommands();
    });

    await this.client.login(process.env['DISCORD_TOKEN']);
  }

  private async setupCommands() {
    this.bounty = new BountyFeature();
    await this.bounty.init(this.client);

    await this.rest.put(
      Routes.applicationGuildCommands(this.clientId, this.guildId),
      { body: [...this.bounty.commands] }
    );
  }

  public syncBounty(key: string) {
    if (key !== process.env['SYNC_KEY']) {
      console.error('Invalid sync key provided.');
      return;
    }
    return this.bounty.sync();
  }

  public syncOnExit() {
    https.request({
      method: 'put',
      url: `https://api.jsonbin.io/v3/b/${this.BIN_ID}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': this.BIN_API_KEY,
      },
      data: JSON.stringify(this.bounty),
    } as https.RequestOptions);
  }
}
