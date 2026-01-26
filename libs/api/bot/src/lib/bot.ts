import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { BountyFeature } from './commands/bounty/bounty.cmd';
import { SyncFeature } from './commands/sync/sync.cmd';

export class Bot {
  private readonly clientId = process.env['CLIENT_ID'];
  private readonly guildId = process.env['SERVER_ID'];

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

    const sync = new SyncFeature();
    await sync.init(this.client);

    await this.rest.put(
      Routes.applicationGuildCommands(this.clientId, this.guildId),
      { body: [...this.bounty.commands, ...sync.commands] }
    );
  }

  public syncBounty(key: string) {
    if (key !== process.env['SYNC_KEY']) {
      console.error('Invalid sync key provided.');
      return;
    }
    return this.bounty.sync();
  }
}
