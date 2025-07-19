const express = require("express");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const router = express.Router();

// Get all users (for demo)
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("name email followers following");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post("/", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Follow user
router.post("/:id/follow", async (req, res) => {
  try {
    const { followerId } = req.body;
    const userToFollow = await User.findById(req.params.id);
    const follower = await User.findById(followerId);

    if (!userToFollow || !follower) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add to following/followers arrays
    if (!follower.following.includes(userToFollow._id)) {
      follower.following.push(userToFollow._id);
      userToFollow.followers.push(follower._id);

      await follower.save();
      await userToFollow.save();

      // Create notification
      const notificationService = new NotificationService(req.app.get("io"));
      await notificationService.notifyUser(
        userToFollow._id,
        follower._id,
        "follow",
        `${follower.name} started following you`
      );

      res.json({ message: "Successfully followed user" });
    } else {
      res.status(400).json({ error: "Already following this user" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
