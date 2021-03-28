const mongoose = require('mongoose')

const reqString = {
  type: String,
  required: true,
}

const activeSchema = new mongoose.Schema({
  guildId: reqString,
  channelId: reqString,
  messageId: reqString,
})

module.exports = mongoose.model('active-message', activeSchema)
