// const { default: Swal } = require("sweetalert2");

// Timer Script
// let time = 60; // 1 minutes in seconds
// const timerDisplay = document.getElementById("timer");
// // const resendButton = document.getElementById("resend-button");

// function startTimer() {
//     const countdown = setInterval(() => {
//         let minutes = Math.floor(time / 60);
//         let seconds = time % 60;
//         seconds = seconds < 10 ? "0" + seconds : seconds;
//         timerDisplay.textContent = `${minutes}:${seconds}`;
        
//         if (time <= 0) {
//             clearInterval(countdown);
//             resendButton.disabled = false;
//             resendButton.classList.add("active");
//         }
        
//         time--;
//     }, 1000);
// }

// Resend Button Action
// resendButton.addEventListener("click", () => {
    // function resendOTP() {
    // time = 60; // Reset to 1 minutes
    // resendButton.disabled = true;
    // resendButton.classList.remove("active");
    // startTimer(); // Restart timer
//     $.ajax({
//         type:"POST",
//         url:"/resend-otp",
//         success:function (response) {
//             if(response.success){
//                 Swal.fire({
//                     icon:"success",
//                     title: 'Auto close alert!',
                   
//                     timer: 2000   
//                 })
//             }else{
//                 Swal.fire({
//                     icon:"error",
//                     title:"Error",
//                     text:"an error occured while resending OTP"
// ,                })
//             }
            
//         }
//     })
   
// };

// startTimer(); // Initialize timer on page load


// Timer Script
let time = 60; // 2 minutes in seconds
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

// Resend Button Action
resendButton.addEventListener("click", () => {
    time = 60; // Reset to 2 minutes
    resendButton.disabled = true;
    resendButton.classList.remove("active");
    startTimer(); // Restart timer
});

startTimer(); // Initialize timer on page load

