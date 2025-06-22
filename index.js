const {
  Client,
  GatewayIntentBits,
  Events,
  PermissionFlagsBits,
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
        }\n**Destination Channel**: ${
          data.destinationChannel ? `<#${data.destinationChannel}>` : "None"
        }`
      );
    }

    if (cmdName === "!setChannels") {
      if (mentions.channels.size < 3) {
        return await message.reply(
          "Please mention **three channels** in format:\n`!setChannels <ChannelOne> <ChannelTwo> <DestinationChannel>`"
        );
      }

      data.channelOne = mentions.channels.at(0).id;
      data.channelTwo = mentions.channels.at(1).id;
      data.destinationChannel = mentions.channels.at(2).id;

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
    const { channelOne, channelTwo, destinationChannel } = data;

    if (![channelOne, channelTwo].includes(channel.id)) return;

    const [embed] = embeds;

    if (!embed) return;

    embed.data.footer = {
      text: "OOS Ticketing",
      icon_url: "attachment://footer.jpg",
    };
    embed.data.title = "OOS Bypass Link has arrived";
    embed.data.thumbnail = null;

    if (channel.id === channelTwo) {
      embed.data.title = undefined;
      embed.data.url = undefined;
    }

    let link;

    if (channel.id === channelOne) {
      link = embed.data.fields?.[1]?.value;
    } else if (channel.id === channelTwo) {
      link = embed.data.fields?.[0]?.value;
    }

    embed.data.fields = undefined;
    embed.data.description = link.replace(
      "Click Here",
      "Click Here to redirect"
    );

    const destChannel = await client.channels.fetch(destinationChannel);

    await destChannel.send({
      content,
      embeds: [embed],
      files: ["./assets/footer.jpg"],
    });
  } catch (error) {
    console.error(error);
  }
});

client.login(TOKEN);
