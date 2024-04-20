import { Client, Events, MessageReaction, userMention } from 'discord.js';
import { BountyFeature } from './bounty.cmd';

export class AcceptBounty {
  constructor(
    private readonly client: Client,
    private readonly feature: BountyFeature
  ) {}

  public init() {
    this.client.on(Events.MessageReactionAdd, async (reaction) => {
      if (!this.feature.author) return;
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
      await this.acceptBounty(message);
    });
  }

  private async acceptBounty(reaction: MessageReaction) {
    if (reaction.message.channelId !== this.feature.channel?.id) return;
    if (reaction.emoji.name !== this.feature.config.react) return;

    const users = await reaction.users.fetch();
    const author = !!users.find((user) => user.id !== this.feature.author?.id);
    const council = !!users.find((user) =>
      this.feature.isAdmin(
        this.feature.channel?.guild?.members.cache.get(user.id)
      )
    );

    if (author || council) {
      const message = `${userMention(
        reaction.message.author.id
      )} has completed ${userMention(
        this.feature.author.id
      )}'s bounty! They may now set the next bounty using \`/set-bounty\`!`;
      this.feature.channel?.send(message);
      await reaction.remove();
      this.feature.setWinner(reaction.message.author);
    }
  }
}
