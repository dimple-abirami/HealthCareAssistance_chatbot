const chatBox = document.querySelector(".chat-box");
const inputField = chatBox.querySelector("input[type='text']");
const button = chatBox.querySelector("button");
const chatBoxBody = chatBox.querySelector(".chat-box-body");

let isWaitingForResponse = false;
let questionNumber = 0;

button.addEventListener("click", sendMessage);

inputField.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
    
});

function sendMessage() {
    const message = inputField.value;
    if(questionNumber===0){
    const chatBoxFooter = document.querySelector(".chat-box-footer");
    chatBoxFooter.style.display = "none";
    }

    if (!isWaitingForResponse) {
        displayUserMessage(message);
        fetchMessageFromServer(message);
    }
}

function fetchMessageFromServer(message) {
    isWaitingForResponse = true;
    fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: {
            accept: 'application.json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message})
    }).then(response => {
        return response.json();
    }).then(data => {
            displayAIMessage(data.message,data.options); 
            questionNumber++;
            isWaitingForResponse = false
    });
}

function displayUserMessage(message) {
    chatBoxBody.innerHTML += `<div class="message"><span>${message}</span></div>`;
    scrollToBottom();
}

function displayAIMessage(message, options) {
    let messageHTML = `<div class="response"><p>${message}</p>`;
    
    if (options && options.length > 0) {
        const existingForm = document.querySelector('.optionsForm');
        if (existingForm) {
            existingForm.parentNode.removeChild(existingForm); 
        }
        messageHTML += "</div>";
        messageHTML += "<form class='form optionsForm'>"; 
        options.forEach(option => {
            if (option !== '') {
                messageHTML += `<input type="radio" name="option" value="${option}">${option}<br>`;
            }
        });
        messageHTML += `<input type="text" name="text" placeholder="if other is selected..."><br>`;
        messageHTML += "<button class='button-submit' type='submit'>Submit</button></form>"; 
    }
    
    
    chatBoxBody.innerHTML += messageHTML;
    
    const optionsForm = document.querySelector('.optionsForm'); 
    optionsForm.addEventListener('submit', function(event) {
        event.preventDefault(); 
        let selectedOption = optionsForm.querySelector('input[name="option"]:checked').value;
        if (selectedOption.indexOf('Other') === -1) {
            send(selectedOption);
        } else {
            selectedOption = optionsForm.querySelector('input[name="text"]').value;
            send(selectedOption);
        }
    });
    
    scrollToBottom();
}

function send(selectedOption){
    if (!isWaitingForResponse) {
        displayUserMessage(selectedOption);
        sendOptionToBackend(selectedOption);
    }
}
function sendOptionToBackend(selectedOption) {
    isWaitingForResponse = true;
    fetch('http://localhost:3000/message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: selectedOption })
    }).then(response => {
        return response.json();
    }).then(data => {
        if (questionNumber < 10) {
            displayAIMessage(data.message,data.options); 
            questionNumber++;
            isWaitingForResponse = false;
        } else {
            displayAIMessage("Final Diagnosis: " + data.message);
            isWaitingForResponse = false;
            questionNumber=0;
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}
function scrollToBottom() {
    chatBoxBody.scrollTop = chatBoxBody.scrollHeight;
}
