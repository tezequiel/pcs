import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, runTransaction, serverTimestamp, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
    window.location.hash = (new Date().getTime() * Math.floor(Math.random() + 1)).toString();
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.turnable').forEach((turnable) => {
        turnable.onclick = () => onCardClicked(turnable);
    });

    const setWords = (palabrasX, palabrasY) => {
        document.querySelectorAll('.palabra-x').forEach((span, index) => {
            span.textContent = palabrasX[index] || "---";
        });

        document.querySelectorAll('.palabra-y').forEach((span, index) => {
            span.textContent = palabrasY[index] || "---";
        });
    }

    const gameId = window.location.hash.slice(1);

    const onCardClicked = (element) => {
        const finishedRef = ref(db, `games/${gameId}/finished`);
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

    const missCounter = document.getElementById('missCounter');

    const updateCounter = (value) => {
        missCounter.textContent = value;
        const missCountRef = ref(db, `games/${gameId}/missCount`);
        runTransaction(missCountRef, () => {
            return value;
        });
        if (value === 0) {
            missCounter.classList.remove('state-active');
            missCounter.classList.add('state-zero');
        } else {
            missCounter.classList.remove('state-zero');
            missCounter.classList.add('state-active');
        }
    }

    document.getElementById('btn-increment').addEventListener('click', () => {
        if (Number(missCounter.textContent) < 25) {
            updateCounter(Number(missCounter.textContent) + 1);
        }
    });

    document.getElementById('btn-decrement').addEventListener('click', () => {
        if (Number(missCounter.textContent) > 0) {
            updateCounter(Number(missCounter.textContent) - 1);
        }
    });

    try {

        const gameRef = ref(db, `games/${gameId}`);

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

            set(gameRef, {
                createdAt: serverTimestamp(),
                xWords: xWords,
                yWords: yWords,
                finished: '',
                missCount: 0
            }).catch((error) => {
                console.error("Error saving new game: ", error);
            });
        }

        onValue(gameRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setWords(data.xWords, data.yWords);
                updateCounter(data.missCount);
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
                } else if(coordinates.length === 24) {
                    document.querySelector('.turnable:not(.volteada)').click();
                }
            } else {
                window.location.replace(window.location.pathname);
            }
        });

    } catch (error) {
        console.error("Error al cargar las palabras desde el JSON:", error);
    }
});
