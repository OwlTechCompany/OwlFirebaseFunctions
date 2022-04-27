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
