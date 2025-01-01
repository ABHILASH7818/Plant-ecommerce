


// Timer Script
let time = 60; // 1 minutes in seconds
const timerDisplay = document.getElementById("timer");
const resendButton = document.getElementById("resend-button");

function startTimer() {
    const countdown = setInterval(() => {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        seconds = seconds < 10 ? "0" + seconds : seconds;
        timerDisplay.textContent = `${minutes}:${seconds}`;
        
        if (time <= 0) {
            clearInterval(countdown);
            resendButton.disabled = false;
            resendButton.classList.add("active");
        }
        
        time--;
    }, 1000);
}


startTimer(); // Initialize timer on page load

