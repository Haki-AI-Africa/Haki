const { logger } = require('@librechat/data-schemas');
const { ViolationTypes } = require('librechat-data-provider');
const { logViolation } = require('~/cache');
const { Subscription, Message } = require('~/db/models');

const FREE_MESSAGE_LIMIT = 10;

/**
 * Returns start of current month as a Date
 */
function getStartOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Checks if a user has remaining messages based on their subscription plan.
 * Throws an error if the user has exceeded their message limit.
 *
 * @param {Object} params
 * @param {Object} params.req - Express request object
 * @param {Object} params.res - Express response object
 * @returns {Promise<boolean>} true if the user can send a message
 * @throws {Error} if the user has exceeded their message limit
 */
const checkMessageLimit = async ({ req, res }) => {
  const userId = req.user.id;

  let subscription = await Subscription.findOne({ user: userId }).lean();
  if (!subscription) {
    subscription = await Subscription.create({ user: userId, plan: 'free', status: 'active' });
    subscription = subscription.toObject();
  }

  // Standard active subscribers get unlimited messages
  if (subscription.plan === 'standard' && subscription.status === 'active') {
    return true;
  }

  // Count user messages this month
  const startOfMonth = getStartOfMonth();
  const messagesUsed = await Message.countDocuments({
    user: userId,
    isCreatedByUser: true,
    createdAt: { $gte: startOfMonth },
  });

  // Free allowance not yet exhausted
  if (messagesUsed < FREE_MESSAGE_LIMIT) {
    return true;
  }

  // Free allowance exhausted, try to use message credits
  if (subscription.messageCredits > 0) {
    const result = await Subscription.findOneAndUpdate(
      { user: userId, messageCredits: { $gt: 0 } },
      { $inc: { messageCredits: -1 } },
      { new: true },
    );

    if (result) {
      return true;
    }
  }

  // No messages remaining
  const type = ViolationTypes.MESSAGE_LIMIT;
  const errorMessage = {
    type,
    messagesUsed,
    messageLimit: FREE_MESSAGE_LIMIT,
    messageCredits: subscription.messageCredits || 0,
  };

  await logViolation(req, res, type, errorMessage, 0);
  throw new Error(JSON.stringify(errorMessage));
};

module.exports = {
  checkMessageLimit,
};
