const messageSchema = require('../models/message')
const { addToCache } = require('../features/rr')
const activeSchema = require('../models/active-message')
const { MessageEmbed } = require("discord.js");

module.exports = {
  name: `message`,
  aliases: ["msg"],
  minArgs: 1,
  requiredPermissions: ['ADMINISTRATOR'],
  async execute(message, args) {
    const { guild, mentions } = message
    const { channels } = mentions
    const targetChannel = channels.first() || message.channel
    
    if (!args.length) {
      const erembed = new MessageEmbed()
      .setTitle(`❌ Invalid Usage!`)
      .setDescription(`\n${message.client.prefix}message <Message>\n${message.client.prefix}message [Channel] <Message>`)
      .setColor("#f72f43")
      return message.channel.send(erembed)
    }

    if (channels.first()) {
      args.shift()
    }

    len = !args.length
    if (channels.first() && len) {
      const erembed = new MessageEmbed()
      .setTitle(`❌ Invalid Usage!`)
      .setDescription(`\n${message.client.prefix}message [Channel] <Message>`)
      .setColor("#f72f43")
      return message.channel.send(erembed)
    }

    const text = args.join(' ')
    const embed = new MessageEmbed()
    .setDescription(`**__${text}__**`)
    .setColor("#24d8de")
    const newMessage = await targetChannel.send(embed)
    
    if (channels.first()) {
      const chembed = new MessageEmbed()
      .setTitle(`✅ Success`)
      .setDescription(`Message set!`)
      .setColor("#2ff78c")
      message.channel.send(chembed)
    }

    if (guild.me.hasPermission('MANAGE_MESSAGES')) {
      if (!channels.first()) {
        message.delete()  
      }
    }

    if (!guild.me.hasPermission('MANAGE_ROLES')) {
      message.channel.send(
        '**❌ The bot requires access to manage roles to be able to give or remove roles**'
      )
      return
    }

    addToCache(guild.id, newMessage)//cache and active-message
    await activeSchema.findOneAndUpdate({
      guildId: guild.id
    }, {
      guildId: guild.id,
      channelId: targetChannel.id,
      messageId: newMessage.id,
    }, {
      upsert: true,
    })
    //save to mongo
    new messageSchema({
      guildId: guild.id,
      channelId: targetChannel.id,
      messageId: newMessage.id,
    })
      .save()
      .catch(() => {
        message
          .channel.send('Failed to save to the database, please report this!')
          .then((message) => {
            message.delete({
              timeout: 1000 * 10,
            })
          })
      })
  
  }
}
