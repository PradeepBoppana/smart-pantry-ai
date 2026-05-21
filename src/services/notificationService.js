/**
 * Smart Pantry AI — Notification Service
 * =========================================
 * Firebase push notifications + daily expiry check cron jobs.
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { PantryItem, User } = require('../models');

// Firebase Admin (initialize only if credentials exist)
let firebaseAdmin = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    firebaseAdmin = admin;
    console.log('✅ Firebase initialized');
  }
} catch (error) {
  console.warn('⚠️ Firebase not configured — push notifications disabled');
}

/**
 * Send a push notification to a user
 * @param {string} fcmToken - Firebase Cloud Messaging token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Optional data payload
 */
async function sendPushNotification(fcmToken, title, body, data = {}) {
  if (!firebaseAdmin || !fcmToken) return false;

  try {
    await firebaseAdmin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: { ...data, click_action: 'FLUTTER_NOTIFICATION_CLICK' },
      android: {
        priority: 'high',
        notification: { channelId: 'pantry_alerts' }
      },
      apns: {
        payload: { aps: { badge: 1, sound: 'default' } }
      }
    });
    return true;
  } catch (error) {
    console.error('Push notification error:', error.message);
    return false;
  }
}

/**
 * Check for expiring items and notify users
 * Called daily by cron job
 */
async function checkExpiringItems() {
  try {
    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const threeDays = new Date();
    threeDays.setDate(threeDays.getDate() + 3);

    // Find items expiring in next 3 days grouped by family
    const expiringItems = await PantryItem.findAll({
      where: {
        status: 'active',
        expiryDate: {
          [Op.between]: [now.toISOString().split('T')[0], threeDays.toISOString().split('T')[0]]
        }
      },
      order: [['expiryDate', 'ASC']]
    });

    // Group by family
    const familyGroups = {};
    expiringItems.forEach(item => {
      if (!familyGroups[item.familyId]) familyGroups[item.familyId] = [];
      familyGroups[item.familyId].push(item);
    });

    // Send notifications per family
    for (const [familyId, items] of Object.entries(familyGroups)) {
      const users = await User.findAll({
        where: { familyId, fcmToken: { [Op.ne]: null } }
      });

      const expiresTomorrow = items.filter(i =>
        new Date(i.expiryDate) <= tomorrow
      );

      let title, body;
      if (expiresTomorrow.length > 0) {
        const names = expiresTomorrow.slice(0, 3).map(i => i.name).join(', ');
        title = `⚠️ ${expiresTomorrow.length} item${expiresTomorrow.length > 1 ? 's' : ''} expiring tomorrow!`;
        body = `${names}${expiresTomorrow.length > 3 ? ` and ${expiresTomorrow.length - 3} more` : ''} — tap for recipe ideas to use them up`;
      } else {
        const names = items.slice(0, 3).map(i => i.name).join(', ');
        title = `🕐 ${items.length} item${items.length > 1 ? 's' : ''} expiring soon`;
        body = `${names} — plan ahead to reduce waste`;
      }

      for (const user of users) {
        await sendPushNotification(user.fcmToken, title, body, {
          type: 'expiry_alert',
          familyId,
          itemCount: String(items.length)
        });
      }
    }

    // Auto-expire items past their date
    const expired = await PantryItem.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiryDate: { [Op.lt]: now.toISOString().split('T')[0] }
        }
      }
    );

    console.log(`📢 Expiry check: ${expiringItems.length} items expiring, ${expired[0]} auto-expired`);
  } catch (error) {
    console.error('Expiry check error:', error);
  }
}

/**
 * Initialize cron jobs
 */
function initCronJobs() {
  // Daily at 8:00 AM — check expiring items and notify
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Running daily expiry check...');
    await checkExpiringItems();
  });

  // Every 6 hours — auto-expire past-date items silently
  cron.schedule('0 */6 * * *', async () => {
    const now = new Date();
    await PantryItem.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiryDate: { [Op.lt]: now.toISOString().split('T')[0] }
        }
      }
    );
  });

  console.log('⏰ Cron jobs initialized');
}

module.exports = {
  sendPushNotification,
  checkExpiringItems,
  initCronJobs
};
