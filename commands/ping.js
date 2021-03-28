const { MessageEmbed } = require(`discord.js`);


module.exports = {
  name: `ping`,
  description: `Gives you the ping of the Bot`,
  aliases: ["latency"],

  execute(message) {
    
    const embed  = new MessageEmbed()
    .setTitle(`Ping!`)
    .setDescription(`⌛ ${Math.round(message.client.ws.ping)} ms \n\n⏱️ ${Date.now() - message.createdTimestamp} ms`)
    .setColor("#F0EAD6")
    message.channel.send(embed)

  }
}