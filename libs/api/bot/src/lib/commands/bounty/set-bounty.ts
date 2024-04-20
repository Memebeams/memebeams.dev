import axios from 'axios';
import {
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
  Events,
  GuildMember,
  TimestampStyles,
  User,
  channelMention,
  roleMention,
  time,
} from 'discord.js';
import { Bounty } from './bounty';
import { BountyFeature } from './bounty.cmd';

export class SetBounty {
  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public init() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case 'set-bounty':
            await this.setBounty(interaction);
            break;
        }
      }
    });
  }

  private async setBounty(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;
    await interaction.deferReply({ ephemeral: true });

    if (!this.feature.verifyChannel(interaction)) {
      interaction.editReply({
        content: `You can only post bounties in ${channelMention(
          this.feature.channel?.id ?? ''
        )}`,
      });
      return;
    }

    const author =
      interaction.options.getUser(this.feature.USER_KEY) ?? interaction.user;
    // If the user running the command is not an admin
    if (!this.feature.isAdmin(interaction.member as GuildMember)) {
      // And the user is not the author of the bounty
      if (author.id !== interaction.user.id) {
        interaction.editReply({
          content: `Only ${roleMention(
            this.feature.role.id
          )} can post bounties for other users.`,
        });
        return;
      }

      if (!this.feature.isWinner(author)) {
        interaction.editReply({
          content: `To post a bounty, you must have been the one to complete the last bounty.`,
        });
        return;
      }
    }

    const bounty = this.generateBounty(interaction, author);
    const embed = await this.generateEmbedFromBounty(bounty, author);
    await interaction.deleteReply();
    await this.feature.channel?.send({
      embeds: [embed],
    });

    this.feature.author = author;
    this.feature.bounty = bounty;
  }

  private generateBounty(
    interaction: ChatInputCommandInteraction,
    author: User
  ): Bounty {
    const posted = new Date().getTime();
    const due = Math.floor(posted / 1000 + 60 * 60 * 24 * 14);

    const target = interaction.options.getString(this.feature.TARGET_KEY);
    const reference =
      interaction.options.getString(this.feature.REFERENCE_KEY) ?? target;

    return {
      target,
      reference,
      authorId: author.id,
      due,
      posted,
    };
  }

  private async generateEmbedFromBounty(
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
