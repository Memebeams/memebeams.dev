import axios from 'axios';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  GuildMember,
  GuildTextBasedChannel,
  Role,
  SlashCommandBuilder,
  TextChannel,
  TimestampStyles,
  User,
  time,
} from 'discord.js';
import { AcceptBounty } from './accept-bounty';
import { Bounty } from './bounty';
import { LoadBounty } from './load-bounty';
import { SaveBounty } from './save-bounty';
import { SetBounty } from './set-bounty';
import { ShowBounty } from './show-bounty';

export class BountyFeature {
  public readonly TARGET_KEY = 'target';
  public readonly REFERENCE_KEY = 'reference';
  public readonly USER_KEY = 'user';
  public readonly SERVER_ID = process.env['SERVER_ID'];

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
  private showBounty: ShowBounty;

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

  private readonly ShowBountyCommand = new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('See the current bounty.')
    .toJSON();

  public readonly commands = [this.SetBountyCommand, this.ShowBountyCommand];

  public async init(client: Client) {
    this.setBounty = new SetBounty(client, this);
    this.setBounty.init();

    this.acceptBounty = new AcceptBounty(client, this);
    this.acceptBounty.init();

    this.saveBounty = new SaveBounty(this);
    this.loadBounty = new LoadBounty(client, this);

    this.showBounty = new ShowBounty(client, this);
    this.showBounty.init();

    console.info('Finding role and channel...');
    await this.findRoleAndChannel(client);

    if (process.env['LOAD_BOUNTY'] === 'true') {
      console.info('Looking for existing bounty...');
      await this.loadBounty.load();
      console.info(
        this.bounty
          ? `Bounty for "${this.bounty.target}" found.`
          : 'No bounty found.'
      );
    }

    console.info('Bounty Feature initialized.');
  }

  public sync() {
    if (!this.bounty) {
      console.error('Tried to save undefined bounty.');
      return;
    }
    return this.saveBounty.sync();
  }

  private async findRoleAndChannel(client: Client) {
    const guild = client.guilds.cache.find(
      (guild) => guild.id === this.SERVER_ID
    );
    if (!guild) throw new Error('Guild not found, check your server ID.');
    this.channel = await guild.channels.cache
      .filter((channel): channel is TextChannel => channel.isTextBased())
      .find((channel) => channel.name === this.config.channel);
    console.info('Channel:', this.channel?.name);

    const roles = await guild.roles.fetch();
    this.role = roles.find((role) => role.name === this.config.adminRole);
    console.info('Admin Role:', this.role?.name);
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

  public generateBounty(
    interaction: ChatInputCommandInteraction,
    author: User
  ): Bounty {
    const posted = new Date().getTime();
    const due = Math.floor(posted / 1000 + 60 * 60 * 24 * 14);

    const target = interaction.options.getString(this.TARGET_KEY);
    const reference = interaction.options.getString(this.REFERENCE_KEY);

    return {
      target,
      reference: reference ? reference : target,
      authorId: author.id,
      due,
      posted,
    };
  }

  public async generateEmbedFromBounty(
    { target, reference, due, posted }: Bounty,
    author: User
  ) {
    let embed = new EmbedBuilder()
      .setTitle('**WANTED:**')
      .setDescription(`**${target}**`)
      .setColor([200, 0, 0])
      .addFields({
        name: 'Due:',
        value: time(due, TimestampStyles.RelativeTime),
      })
      .setAuthor({
        name: `${author.username} posted a bounty!`,
        iconURL: author.displayAvatarURL(),
      })
      .setTimestamp(posted);

    const title = reference.startsWith('https://oldschool.runescape.wiki/w/')
      ? reference.substring('https://oldschool.runescape.wiki/w/'.length)
      : reference;
    const path = title.replace(/ /g, '_');

    const response = await axios.get(
      'https://oldschool.runescape.wiki/api.php',
      {
        headers: {
          'User-Agent': 'clan-discord-bot',
        },
        params: {
          action: 'query',
          format: 'json',
          prop: 'pageimages',
          titles: path,
          formatversion: '2',
          piprop: 'thumbnail|name',
          pithumbsize: '128',
        },
      }
    );

    const image = response.data?.query?.pages[0]?.thumbnail?.source;
    if (image) {
      embed = embed.setImage(image);
      embed.setDescription(
        `[**${target}**](https://oldschool.runescape.wiki/w/${path})`
      );
    }

    return embed;
  }
}
