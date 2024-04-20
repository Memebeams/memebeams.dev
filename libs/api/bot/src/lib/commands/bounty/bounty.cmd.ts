import {
  ChatInputCommandInteraction,
  Client,
  GuildMember,
  GuildTextBasedChannel,
  Role,
  SlashCommandBuilder,
  TextChannel,
  User,
} from 'discord.js';
import { AcceptBounty } from './accept-bounty';
import { Bounty } from './bounty';
import { LoadBounty } from './load-bounty';
import { SaveBounty } from './save-bounty';
import { SetBounty } from './set-bounty';

export class BountyFeature {
  public readonly TARGET_KEY = 'target';
  public readonly REFERENCE_KEY = 'reference';
  public readonly USER_KEY = 'user';

  public channel?: GuildTextBasedChannel = undefined;
  public role?: Role = undefined;
  public author?: User = undefined;
  public winner?: User = undefined;

  public bounty?: Bounty;

  // TODO: Add config support
  public readonly config = {
    channel: 'bounty-board',
    adminRole: 'Council',
    react: '✅',
  };

  private setBounty: SetBounty;
  private acceptBounty: AcceptBounty;
  private saveBounty: SaveBounty;
  private loadBounty: LoadBounty;

  private readonly SetBountyCommand = new SlashCommandBuilder()
    .setName('set-bounty')
    .setDescription('Set a new bounty.')
    .addStringOption((option) =>
      option
        .setName(this.TARGET_KEY)
        .setDescription('The target of your bounty.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName(this.REFERENCE_KEY)
        .setDescription(
          'The name of an item or wiki URL to attach to this bounty.'
        )
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName(this.USER_KEY)
        .setDescription('(Admin) Override the user that set the bounty.')
        .setRequired(false)
    )
    .toJSON();

  public readonly commands = [this.SetBountyCommand];

  public async init(client: Client) {
    this.setBounty = new SetBounty(client, this);
    this.setBounty.init();

    this.acceptBounty = new AcceptBounty(client, this);
    this.acceptBounty.init();

    this.saveBounty = new SaveBounty(this);
    this.loadBounty = new LoadBounty(client, this);

    await this.findRoleAndChannel(client);

    await this.loadBounty.load();

    console.log('Bounty Feature initialized.');
    console.log('Channel:', this.channel?.name);
    console.log('Admin Role:', this.role?.name);
  }

  public async sync() {
    if (!this.bounty) return;
    this.saveBounty.sync();
  }

  private async findRoleAndChannel(client: Client) {
    const guilds = await client.guilds.fetch();
    const guild = await guilds
      .find((guild) => guild.id === process.env['SERVER_ID'])
      .fetch();
    const channels = await guild.channels.fetch();
    this.channel = channels
      .filter((channel): channel is TextChannel => channel.isTextBased())
      .find((channel) => channel.name === this.config.channel);
    const roles = await guild.roles.fetch();
    this.role = roles.find((role) => role.name === this.config.adminRole);
  }

  public verifyChannel(interaction: ChatInputCommandInteraction) {
    return interaction.channelId === this.channel?.id;
  }

  public isAdmin(member: GuildMember) {
    return member.roles.cache.some(
      (role) => role.name === this.config.adminRole
    );
  }

  public isWinner(user: User) {
    return this.winner?.id === user.id;
  }

  public isAuthor(user: User) {
    return this.author?.id === user.id;
  }

  public setBountyData(
    target: string,
    due: number,
    posted: number,
    reference?: string,
    author?: User
  ) {
    this.bounty = {
      target,
      due,
      posted,
      reference,
      authorId: author?.id,
    };
  }

  public setWinner(winner: User) {
    this.winner = winner;
    if (this.bounty) {
      this.bounty.winnerId = winner.id;
    }
  }
}
