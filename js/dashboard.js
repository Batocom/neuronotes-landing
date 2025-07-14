firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "auth.html";
    return;
  }

  const uid = user.uid;

  // Fetch user info from Firestore
  firebase.firestore().collection("users").doc(uid).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        document.getElementById("welcomeMsg").innerText = `Welcome, ${userData.name || userData.email}`;
      } else {
        document.getElementById("welcomeMsg").innerText = "Welcome!";
      }
    });

  // continue to load study kits here...
});

console.log("📊 NeuroNotes dashboard loaded.");
