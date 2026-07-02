// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC31C1X13eqVAOq_o5K2evI8q3GOfnpOpo",
    authDomain: "iebi-2e84e.firebaseapp.com",
    projectId: "iebi-2e84e",
    storageBucket: "iebi-2e84e.appspot.com",
    messagingSenderId: "634456198202",
    appId: "1:634456198202:web:8b4de1b4def23a49303903"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Exportar as variáveis para uso em outros arquivos
// No contexto de scripts carregados diretamente no HTML, estas variáveis ficarão disponíveis globalmente
