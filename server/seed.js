const mongoose = require("mongoose");
const User = require("./models/User");
const Post = require("./models/Post");
const Notification = require("./models/Notification");
require("dotenv").config();

async function seedData() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/insyd"
    );

    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    await Notification.deleteMany({}); // Add this line

    // Create users
    const users = await User.create([
      { name: "Alice Johnson", email: "alice@example.com" },
      { name: "Bob Smith", email: "bob@example.com" },
      { name: "Carol Davis", email: "carol@example.com" },
      { name: "David Wilson", email: "david@example.com" },
      { name: "Eva Brown", email: "eva@example.com" },
    ]);

    // Create some sample posts
    await Post.create([
      {
        authorId: users[0]._id,
        content:
          "Just finished designing a sustainable office building! Excited to share the blueprints.",
      },
      {
        authorId: users[1]._id,
        content:
          "Modern architecture meets traditional craftsmanship in our latest residential project.",
      },
      {
        authorId: users[2]._id,
        content:
          "Thoughts on incorporating green spaces in urban planning? Would love to hear your ideas!",
      },
    ]);

    console.log("Seed data created successfully!");
    console.log(
      "Users created:",
      users.map((u) => ({ id: u._id, name: u.name }))
    );

    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  }
}

seedData();
