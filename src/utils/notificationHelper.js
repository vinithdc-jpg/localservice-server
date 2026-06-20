import Notification from "../models/Notification.js";

export async function createNotification({ userId, title, message, type = "system", link = "" }) {
  try {
    return await Notification.create({ user: userId, title, message, type, link });
  } catch (err) {
    console.error("Notification error:", err.message);
    return null;
  }
}
