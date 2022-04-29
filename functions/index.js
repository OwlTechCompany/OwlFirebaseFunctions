const functions = require("firebase-functions");
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();


exports.userChanged = functions.firestore
    .document('users/{userId}')
    .onUpdate((change, context) => {
        const newValue = change.after.data();
        const previousValue = change.before.data();

        console.log("New value", newValue);
        console.log("User", context.params.userId);

        const updateUser1PrivateChat = db.collection("chats")
            .where("user1.uid", "==", context.params.userId)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref.update({
                        user1: newValue
                    })
                });
            })

        const updateUser2PrivateChat = db.collection("chats")
            .where("user2.uid", "==", context.params.userId)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    doc.ref.update({
                        user2: newValue
                    })
                });
            })

        return Promise.all([updateUser1PrivateChat, updateUser2PrivateChat])
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
    });

exports.sendMessageListenerPushNotification = functions.firestore
    .document('chatsMessages/{chatId}/messages/{messageId}')
    .onCreate((snap, context) => {
        const message = snap.data();
        console.log("chatId", context.params.chatId);
        console.log("message", message);

        // const messageId = context.params.messageId;

        const sentBy = message.sentBy;

        return db.collection("chats")
            .doc(context.params.chatId.toString())
            .get()
            .then((snap) => {
                var chatData = snap.data();
                var sender = (chatData.user1.uid == sentBy) ? chatData.user1 : chatData.user2
                var recepient = (chatData.user1.uid == sentBy) ? chatData.user2 : chatData.user1
                
                const payload = {
                    token: recepient.fcmToken,
                    notification: {
                        title: sender.firstName,
                        body: message.messageText
                    },
                    data: {
                        body: message.messageText,
                    }
                };
                console.log("chatData", chatData);
                console.log("sender", sender);
                console.log("recepient", recepient);
                console.log("payload", payload);

                return admin.messaging().send(payload).then((response) => {
                    console.log('Successfully sent message:', response);
                }).catch((error) => {
                    console.log("Error sending push: ", error);
                });
            })
    });
