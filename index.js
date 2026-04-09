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
      const args = message.content.trim().split(/\s+/).slice(1);
      // remove the command itself

      if (args.length !== 4) {
        return await message.reply(
          "❌ You must provide **exactly 4 channels** like this:\n" +
            "`!setChannels <ChannelOne> <DestinationChannelOne> <ChannelTwo> <DestinationChannelTwo>`"
        );
      }

      // Extract channel IDs (works for <#id> or plain IDs)
      const [ch1, dest1, ch2, dest2] = args.map((arg) =>
        arg.replace(/[^0-9]/g, "")
      );

      data.channelOne = ch1;
      data.destinationChannelOne = dest1;
      data.channelTwo = ch2;
      data.destinationChannelTwo = dest2;

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
      `[Click Here to redirect](${ embed.data.fields?.[6]?.value?.replaceAll('||','')})`
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
