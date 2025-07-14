function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      document.getElementById("message").innerText = `❌ ${error.message}`;
    });
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      firebase.firestore().collection("users").doc(user.uid).set({
        email: user.email,
        createdAt: new Date()
      });

      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      document.getElementById("message").innerText = `⚠️ ${error.message}`;
    });
}

function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();

  firebase.auth().signInWithPopup(provider)
    .then((result) => {
      const user = result.user;

      firebase.firestore().collection("users").doc(user.uid).set({
        name: user.displayName,
        email: user.email,
        photo: user.photoURL,
        lastLogin: new Date()
      }, { merge: true });

      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      document.getElementById("message").innerText = `⚠️ ${error.message}`;
    });
}
