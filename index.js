const {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const fs = require("fs/promises");
const data = require("./data.json");

const { TOKEN } = process.env;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(
    `Ready! Logged in as ${readyClient.user.tag} (${readyClient.user.id})`
  );
});

client.on(Events.MessageCreate, async (message) => {
  try {
    const { member, content, guild, mentions, author } = message;

    if (!guild || author.bot) return;
    if (!member.permissions.has(PermissionFlagsBits.Administrator)) return;

    const [cmdName] = content.split(" ");

    if (cmdName === "!viewChannels") {
      return await message.reply(
        `**Channel One**: ${
          data.channelOne ? `<#${data.channelOne}>` : "None"
        }\n**Channel Two**: ${
          data.channelTwo ? `<#${data.channelTwo}>` : "None"
        }\n**Destination Channel One**: ${
          data.destinationChannelOne
            ? `<#${data.destinationChannelOne}>`
            : "None"
        }\n**Destination Channel Two**: ${
          data.destinationChannelTwo
            ? `<#${data.destinationChannelTwo}>`
            : "None"
        }`
      );
    }

    if (cmdName === "!setChannels") {
      if (mentions.channels.size < 4) {
        return await message.reply(
          "Please mention **four channels** in format:\n`!setChannels <ChannelOne> <DestinationChannelOne> <ChannelTwo> <DestinationChannelTwo>`"
        );
      }

      data.channelOne = mentions.channels.at(0).id;
      data.destinationChannelOne = mentions.channels.at(1).id;
      data.channelTwo = mentions.channels.at(2).id;
      data.destinationChannelTwo = mentions.channels.at(3).id;

      await fs.writeFile("./data.json", JSON.stringify(data, null, 2));

      return await message.reply(
        "✅ Channels saved! Use `!viewChannels` to confirm."
      );
    }
  } catch (error) {
    console.error(error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    const { channel, content, embeds } = message;
    const {
      channelOne,
      channelTwo,
      destinationChannelOne,
      destinationChannelTwo,
    } = data;

    if (![channelOne, channelTwo].includes(channel.id)) return;

    const [embed] = embeds;

    if (!embed) return;

    const isChannelOne = channel.id === channelOne;

    const destinationChannel = isChannelOne
      ? destinationChannelOne
      : destinationChannelTwo;

    const modifiedEmbed = EmbedBuilder.from(embed)
      .setTitle("OOS Bypass Link has arrived")
      .setColor("Orange")
      .setThumbnail(null)
      .setURL(null)
      .setFields([])
      .setTimestamp();

    if (isChannelOne) {
      modifiedEmbed.setDescription(
        embed.data.fields?.[1]?.value?.replace(
          "Click Here",
          "Click Here to redirect"
        )
      );
    } else {
      modifiedEmbed.setDescription(
        embed.data.description.replace("Share Link", "Click Here to redirect")
      );
    }

    modifiedEmbed.data.footer = {
      text: "OOS Ticketing",
      icon_url: "attachment://footer.jpg",
    };

    const destChannel = await client.channels.fetch(destinationChannel);

    await destChannel.send({
      content,
      embeds: [modifiedEmbed],
      files: ["./assets/footer.jpg"],
    });
  } catch (error) {
    console.error(error);
  }
});

client.login(TOKEN);
