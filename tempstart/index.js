// Function to validate email format
function isValidEmail(email) {
    // Regular expression to validate email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Function to handle form submission
function handleSubmit(event) {
    event.preventDefault(); // Prevent form submission
    const emailInput = document.getElementById("email");
    const email = emailInput.value.trim(); // Trim whitespace from email

    // Validate email format
    if (!isValidEmail(email)) {
        alert("Vänligen ange en giltig e-postadress.");
        return;
    }

    // Submit the form if email is valid
    document.getElementById("emailForm").submit();
}
// Function to handle input on the email field
function handleEmailInput(event) {
    // Define the whitelist of allowed characters
    const allowedCharacters = /^[a-zA-Z0-9@._-]+$/;

    // Check if the input contains any characters not in the whitelist
    if (!allowedCharacters.test(event.target.value)) {
        // Remove the forbidden characters from the input value
        event.target.value = event.target.value.replace(new RegExp(`[^a-zA-Z0-9@._-]`, "g"), "");
    }
}

// Add event listeners to the email input field
const emailInput = document.getElementById("email");
emailInput.addEventListener("input", handleEmailInput);
document.getElementById("emailForm").addEventListener("submit", handleSubmit);
