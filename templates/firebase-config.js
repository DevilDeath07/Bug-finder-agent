const firebaseConfig = {
    apiKey: "{{ firebase_config.apiKey }}",
    authDomain: "{{ firebase_config.authDomain }}",
    databaseURL: "{{ firebase_config.databaseURL }}",
    projectId: "{{ firebase_config.projectId }}",
    storageBucket: "{{ firebase_config.storageBucket }}",
    messagingSenderId: "{{ firebase_config.messagingSenderId }}",
    appId: "{{ firebase_config.appId }}",
    measurementId: "{{ firebase_config.measurementId }}"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();
