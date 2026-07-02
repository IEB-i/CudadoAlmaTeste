
const firebaseConfig2 = {
    apiKey: "AIzaSyCEqseDS-_OSmdfGf-NNflAJnS_AT5i1-U",
    authDomain: "dbiebi.firebaseapp.com",
    databaseURL: "https://dbiebi-default-rtdb.firebaseio.com",
    projectId: "dbiebi",
    storageBucket: "dbiebi.appspot.com",
    messagingSenderId: "1068164821081",
    appId: "1:1068164821081:web:2d3e0030d5311d94f30148"
};

const secondaryApp = firebase.initializeApp(firebaseConfig2, "secondary");
const db2 = secondaryApp.firestore();
