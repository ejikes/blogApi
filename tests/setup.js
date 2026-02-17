const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.test" });

module.exports.connect = async () => {
  // Check if already connected
  if (mongoose.connection.readyState === 0) {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/blog_test";
    await mongoose.connect(uri);
    console.log("Test database connected");
  }
};

module.exports.disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase(); // clean test data
    await mongoose.connection.close();
    console.log("Test database disconnected");
  }
};

module.exports.clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};