const fs = require("fs/promises");

const {
  Client,
  Events,
  GatewayIntentBits,
  PermissionFlagsBits,
} = require("discord.js");

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

    if (cmdName === "!viewChannels")
      return await message.reply(
        `**Receiving Channel**: ${
          data.channelToReceiveMessagesFrom
            ? `<#${data.channelToReceiveMessagesFrom}>`
            : "None"
        }\n**Sending Channel**: ${
          data.channelToSendTo ? `<#${data.channelToSendTo}>` : "None"
        }`
      );

    if (cmdName === "!setChannels") {
      console.log(mentions.channels.size);

      if (mentions.channels.size < 2)
        return await message.reply(
          "Please mention both channels in format `!setChannels <ReceivingChannel> <SendingChannel>`"
        );

      data.channelToReceiveMessagesFrom = mentions.channels.at(0).id;
      data.channelToSendTo = mentions.channels.at(1).id;

      await fs.writeFile(`./data.json`, JSON.stringify(data));

      await message.reply(
        "Channels configured and can be seen via `!viewChannels`"
      );
    }
  } catch (error) {
    console.log(error);
  }
});

client.on(Events.MessageCreate, async (message) => {
  try {
    const { channel, content, embeds } = message;

    if (channel.id !== data.channelToReceiveMessagesFrom) return;

    const [embed] = embeds;

    if (!embed) return;

    embed.data.footer = {};
    embed.data.footer.text = "OOS Ticketing";
    embed.data.thumbnail = null;
    embed.data.footer.icon_url = "attachment://footer.jpg";
    embed.data.title = "OOS Bypass Link has arrived";

    const link = embed.data.fields[1].value;

    embed.data.fields = undefined;

    embed.data.description = link.replace(
      "Click Here",
      "Click Here to redirect"
    );
    const sourceChannel = client.channels.cache.get(data.channelToSendTo);

    await sourceChannel.send({
      content,
      embeds: [embed],
      files: ["./assets/footer.jpg"],
    });
  } catch (error) {
    console.log(error);
  }
});

client.login(TOKEN);
