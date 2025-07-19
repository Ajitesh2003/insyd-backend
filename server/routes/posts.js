const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const NotificationService = require("../services/notificationService");
const router = express.Router();

// Get all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("authorId", "name")
      .populate("likes", "name")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post("/", async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    await post.populate("authorId", "name");

    // Notify followers
    const notificationService = new NotificationService(req.app.get("io"));
    const author = await User.findById(post.authorId);

    await notificationService.notifyFollowers(
      post.authorId,
      `${author.name} shared a new post: "${post.content.substring(0, 50)}..."`,
      "post",
      post._id
    );

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like post
router.post("/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id).populate(
      "authorId",
      "name"
    );
    const user = await User.findById(userId);

    if (!post || !user) {
      return res.status(404).json({ error: "Post or user not found" });
    }

    if (!post.likes.includes(userId)) {
      post.likes.push(userId);
      await post.save();

      // Create notification (don't notify self)
      if (post.authorId._id.toString() !== userId) {
        const notificationService = new NotificationService(req.app.get("io"));
        await notificationService.notifyUser(
          post.authorId._id,
          userId,
          "like",
          `${user.name} liked your post`,
          post._id
        );
      }

      res.json({ message: "Post liked successfully" });
    } else {
      res.status(400).json({ error: "Already liked this post" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment on post
router.post("/:id/comments", async (req, res) => {
  try {
    const { userId, text } = req.body;
    const post = await Post.findById(req.params.id).populate(
      "authorId",
      "name"
    );
    const user = await User.findById(userId);

    if (!post || !user) {
      return res.status(404).json({ error: "Post or user not found" });
    }

    post.comments.push({ userId, text });
    await post.save();

    // Create notification (don't notify self)
    if (post.authorId._id.toString() !== userId) {
      const notificationService = new NotificationService(req.app.get("io"));
      await notificationService.notifyUser(
        post.authorId._id,
        userId,
        "comment",
        `${user.name} commented on your post: "${text.substring(0, 30)}..."`,
        post._id
      );
    }

    res.json({ message: "Comment added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
