export const environment = {
  production: true,
  // Em produção (Firebase Hosting), aponte para seu backend
  // Se você estiver rodando o backend localmente enquanto testa no navegador,
  // localhost funciona na sua máquina e CORS já permite a origem do Hosting.
  apiBaseUrl: 'https://worki-backend-699943988715.us-central1.run.app',
  firebase: {
    apiKey: "AIzaSyCiHpk972qK17LkXjwuAxJzcR67Jp8MlqE",
    authDomain: "worki-1f58a.firebaseapp.com",
    projectId: "worki-1f58a",
    storageBucket: "worki-1f58a.firebasestorage.app",
    messagingSenderId: "699943988715",
    appId: "1:699943988715:web:e7f6c085ba49fda8b0fdae",
    measurementId: "G-D6LTMSSTF3"
  },
  supabase: {
    url: 'https://vrklakcbkcsonarmhqhp.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZya2xha2Nia2Nzb25hcm1ocWhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTMzNzAsImV4cCI6MjA4MzkyOTM3MH0.GBoi9dzcYw0dK3EEFCKHV2T9Pc3bSWO8H_FSooeSoM0'
  }
};
