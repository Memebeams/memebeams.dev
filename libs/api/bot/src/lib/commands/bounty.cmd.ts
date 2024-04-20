import axios from 'axios';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GuildMember,
  GuildTextBasedChannel,
  MessageReaction,
  Role,
  SlashCommandBuilder,
  TextChannel,
  TimestampStyles,
  User,
  channelMention,
  roleMention,
  time,
  userMention,
} from 'discord.js';

export class BountyFeature {
  private readonly TARGET_KEY = 'target';
  private readonly REFERENCE_KEY = 'reference';
  private readonly USER_KEY = 'user';

  private channel?: GuildTextBasedChannel = undefined;
  private role?: Role = undefined;
  private author?: User = undefined;
  private winner?: User = undefined;

  // TODO: Add config support
  private readonly config = {
    channel: 'bounty-board',
    adminRole: 'Council',
    react: '✅',
  };

  private readonly SetBounty = new SlashCommandBuilder()
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

  public readonly commands = [this.SetBounty];

  public async init(client: Client) {
    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case 'set-bounty':
            await this.setBounty(interaction);
            break;
        }
      }
    });

    client.on(Events.MessageReactionAdd, async (reaction) => {
      if (!this.author) return;
      let message: MessageReaction;
      if (reaction.partial) {
        try {
          message = await reaction.fetch();
        } catch (error) {
          console.error(
            'Something went wrong when fetching the message:',
            error
          );
          return;
        }
      } else {
        message = reaction as MessageReaction;
      }
      if (reaction.message.channelId !== this.channel?.id) return;
      if (reaction.emoji.name !== this.config.react) return;
      await this.acceptBounty(message);
    });

    await this.findRoleAndChannel(client);
  }

  private async findRoleAndChannel(client: Client) {
    const guilds = await client.guilds.fetch();
    const guild = await guilds.first().fetch();
    const channels = await guild.channels.fetch();
    this.channel = channels
      .filter((channel): channel is TextChannel => channel.isTextBased())
      .find((channel) => channel.name === this.config.channel);
    const roles = await guild.roles.fetch();
    this.role = roles.find((role) => role.name === this.config.adminRole);

    console.log('Bounty Feature initialized.');
    console.log('Channel:', this.channel?.name);
    console.log('Admin Role:', this.role?.name);
  }

  private verifyChannel(interaction: ChatInputCommandInteraction) {
    return interaction.channelId === this.channel?.id;
  }

  private isAdmin(member: GuildMember) {
    return member.roles.cache.some(
      (role) => role.name === this.config.adminRole
    );
  }

  private isWinner(user: User) {
    return this.winner?.id === user.id;
  }

  private isAuthor(user: User) {
    return this.author?.id === user.id;
  }

  private async setBounty(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ ephemeral: true });

    if (!this.verifyChannel(interaction)) {
      interaction.editReply({
        content: `You can only post bounties in ${channelMention(
          this.channel?.id ?? ''
        )}`,
      });
      return;
    }

    const author =
      interaction.options.getUser(this.USER_KEY) ?? interaction.user;
    // If the user running the command is not an admin
    if (!this.isAdmin(interaction.member as GuildMember)) {
      // And the user is not the author of the bounty
      if (author.id !== interaction.user.id) {
        interaction.editReply({
          content: `Only ${roleMention(
            this.role.id
          )} can post bounties for other users.`,
        });
        return;
      }

      if (!this.isWinner(author)) {
        interaction.editReply({
          content: `To post a bounty, you must have been the one to complete the last bounty.`,
        });
        return;
      }
    }

    const embed = await this.generateBountyEmbed(interaction);
    await interaction.deleteReply();
    await this.channel?.send({
      embeds: [embed],
    });
    this.author = author;
  }

  private async acceptBounty(reaction: MessageReaction) {
    const users = await reaction.users.fetch();
    const user = users.first();
    const members = await this.channel.guild.members.fetch();
    const member = members.find((member) => member.id === user?.id);

    if (this.isAdmin(member) || this.isAuthor(user)) {
      const message = `${userMention(
        reaction.message.author.id
      )} has completed ${userMention(
        this.author.id
      )}'s bounty! They may now set the next bounty using \`/set-bounty\`!`;
      this.channel?.send(message);
      await reaction.remove();
      this.winner = reaction.message.author;
      this.clearBounty();
    }
  }

  private clearBounty() {
    this.author = undefined;
  }

  private async generateBountyEmbed(interaction: ChatInputCommandInteraction) {
    const deadline = Math.floor(
      new Date().getTime() / 1000 + 60 * 60 * 24 * 14
    );

    const target = interaction.options.getString(this.TARGET_KEY);
    const user = interaction.options.getUser(this.USER_KEY) ?? interaction.user;

    const reference = interaction.options.getString(this.REFERENCE_KEY);

    let embed = new EmbedBuilder()
      .setTitle('**WANTED:**')
      .setDescription(`**${target}**`)
      .setColor([200, 0, 0])
      .addFields({
        name: 'Due:',
        value: time(deadline, TimestampStyles.RelativeTime),
      })
      .setAuthor({
        name: `${user.username} posted a bounty!`,
        iconURL: user.displayAvatarURL(),
      })
      .setTimestamp();

    if (reference) {
      const title = reference.startsWith('https://oldschool.runescape.wiki/w/')
        ? reference.substring('https://oldschool.runescape.wiki/w/'.length)
        : reference;
      const path = title.replace(/ /g, '_');

      const response = await axios.get(
        'https://oldschool.runescape.wiki/api.php',
        {
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
    }

    return embed;
  }
}
