const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  async notifyUser(userId, fromUserId, type, message, relatedId = null) {
    try {
      // Create notification in database
      const notification = new Notification({
        userId,
        fromUserId,
        type,
        message,
        relatedId,
      });

      await notification.save();
      await notification.populate("fromUserId", "name");

      // Send real-time notification via socket
      if (this.io) {
        this.io.to(userId.toString()).emit("notification", {
          id: notification._id,
          type: notification.type,
          message: notification.message,
          fromUser: notification.fromUserId,
          createdAt: notification.createdAt,
          read: notification.read,
        });
      }

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  }

  async notifyFollowers(authorId, message, type, relatedId = null) {
    try {
      const author = await User.findById(authorId).populate("followers");

      if (author && author.followers.length > 0) {
        const notifications = author.followers.map((follower) => ({
          userId: follower._id,
          fromUserId: authorId,
          type,
          message,
          relatedId,
        }));

        await Notification.insertMany(notifications);

        // Send real-time notifications
        if (this.io) {
          author.followers.forEach((follower) => {
            this.io.to(follower._id.toString()).emit("notification", {
              type,
              message,
              fromUser: { _id: authorId, name: author.name },
              createdAt: new Date(),
              read: false,
            });
          });
        }
      }
    } catch (error) {
      console.error("Error notifying followers:", error);
    }
  }
}

module.exports = NotificationService;
