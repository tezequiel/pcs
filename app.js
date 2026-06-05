import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, runTransaction, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAkV0BJCdFnIpJ9cVKAPRruXiga7mHs2Eg",
    authDomain: "orbox-412b4.firebaseapp.com",
    databaseURL: "https://orbox-412b4.firebaseio.com",
    projectId: "orbox-412b4",
    storageBucket: "orbox-412b4.appspot.com",
    messagingSenderId: "823488201096",
    appId: "1:823488201096:web:0496d71fe3367e9abf7a3d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const isNewGame = !window.location.hash;

if(isNewGame) {
    window.location.hash = new Date().getTime().toString();
}

const gameId = window.location.hash.slice(1);

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.turnable').forEach((turnable) => {
        turnable.onclick = () => onCardClicked(turnable);
    });

    try {

        const config = {};

        if(isNewGame) {
            const response = await fetch('./words.json');
            const words = await response.json();

            // Fisher-Yates
            for (let i = words.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [words[i], words[j]] = [words[j], words[i]];
            }

            const xWords = words.slice(0, 5);
            const yWords = words.slice(5, 10);

            config.gameRef = ref(db, 'games/' + gameId);
            set(config.gameRef, {
                xWords: xWords,
                yWords: yWords,
                finished: ''
            }).then(() => {
                //setWords(xWords, yWords);
            }).catch((error) => {
                console.error("Error al guardar:", error);
            });
        } else {
            config.gameRef = ref(db, 'games/' + gameId);
        }

        onValue(config.gameRef, (snapshot) => {
            const data = snapshot.val();
            console.log("Real-time data:", data);
            if (snapshot.exists()) {
                setWords(snapshot.child("xWords").val(), snapshot.child("yWords").val());
                const coordinates = data.finished.split(";");
                document.querySelectorAll('.turnable').forEach((element) => {
                    let force = coordinates.includes(element.id);
                    element.classList.toggle('volteada', force);
                });
                if(coordinates.length === 25) {
                    setTimeout(() => {
                        confetti({
                            particleCount: 120,
                            spread: 80,
                            origin: { y: 0.6 }
                        });
                    }, 300);
                }
            } else {
                console.log("No data available at this path.");
            }
        });

    } catch (error) {
        console.error("Error al cargar las palabras desde el JSON:", error);
    }
});

function setWords(palabrasX, palabrasY) {
    document.querySelectorAll('.palabra-x').forEach((span, indice) => {
        span.textContent = palabrasX[indice] || "---";
    });

    document.querySelectorAll('.palabra-y').forEach((span, indice) => {
        span.textContent = palabrasY[indice] || "---";
    });
}

function onCardClicked(element) {
    const finishedRef = ref(db, 'games/' + gameId + '/finished');
    runTransaction(finishedRef, (currentValue) => {
        if (currentValue === null || currentValue.length === 0) {
            return element.id;
        } else {
            const finishedOnes = currentValue.split(";");
            if(finishedOnes.includes(element.id)) {
                finishedOnes.splice(finishedOnes.indexOf(element.id), 1);
            } else {
                finishedOnes.push(element.id);
            }
            return finishedOnes.sort().join(";");
        }
    });
}