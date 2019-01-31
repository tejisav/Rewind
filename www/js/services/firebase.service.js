angular.module('rewind.services').factory("firebase", function() {

    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyBCgvJhD0qMmch_dXf1kU9WDflbrYXtp_o",
        authDomain: "rewind-ec53e.firebaseapp.com",
        databaseURL: "https://rewind-ec53e.firebaseio.com",
        projectId: "rewind-ec53e",
        storageBucket: "rewind-ec53e.appspot.com",
        messagingSenderId: "54313311185"
    };
    
    var instance = firebase.initializeApp(config);

    instance.firestore().settings({
        timestampsInSnapshots: true
    });

    return instance;
});