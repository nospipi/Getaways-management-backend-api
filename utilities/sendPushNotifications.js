const { Expo } = require("expo-server-sdk");
let expo = new Expo();

const sendPushNotifications = async (tokens, message) => {
  //console.log(tokens + " //apo function");
  let messages = [];
  for (let pushToken of tokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/push-notifications/sending-notifications/)
    messages.push({
      to: pushToken,
      sound: "default",
      title: message.title,
      priority: "high",
      ttl: 2419200, //Time to Live: the number of seconds for which the message may be kept around for redelivery if it hasn't been delivered yet. 2419200 is 4 weeks
      body: message.body,
      //data: { withSome: 'data' }, //A JSON object delivered to your app.
    });
  }

  // The Expo push notification service accepts batches of notifications so
  // that you don't need to send 1000 requests to send 1000 notifications. We
  // recommend you batch your notifications to reduce the number of requests
  // and to compress them (notifications with similar content will get
  // compressed).
  let chunks = expo.chunkPushNotifications(messages);
  let tickets = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        //console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  })();
};

module.exports = sendPushNotifications;
