const mongoose = require("mongoose");

const userSchema = {
  username: {
    type: String,
    required: true,
  },
};

module.exports = mongoose.model("USER", userSchema);
