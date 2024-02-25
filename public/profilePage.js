
//ProfilePage

import {addEventListeners, initializePage,profileButton} from "../controller/profileController.js";
import {getConnectedUserID,getConnectedUserName} from "../controller/functions.js";
import {loadMorePosts, postsEventListeners} from "../controller/postsController.js"

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
getConnectedUserName()
.then(connectedUserName => {
$(document).ready(() => {
  addEventListeners(userId);
  initializePage(userId);
  profileButton(userId);
  postsEventListeners('homepage', null);
  loadMorePosts(userId, connectedUserName,'profile',null, userId);
  });
});

  
  
  document.addEventListener('DOMContentLoaded', () => {
    getConnectedUserID()
.then(connectedUserID => {
  loadChatHistory(connectedUserID, userId);

    var socket = io();
    socket.emit('register', connectedUserID);
    document.getElementById('chat-form').addEventListener('submit', function(e) {
      e.preventDefault(); 
      var message = document.getElementById('chat-input').value;
      if (message) {
       
        socket.emit('sendMessage', { senderId: connectedUserID, receiverId: userId, text: message });
        document.getElementById('chat-input').value = '';
      }

    });

    socket.on('message', function(message) {
      var item = document.createElement('li');
      item.classList.add("receiver", 'message');

      item.textContent = message;
      document.getElementById('messages').appendChild(item);
    });
    socket.on('messageSent', (message) => {
      var item = document.createElement('li');
      item.classList.add("sender", 'message');
      item.textContent = message;
      document.getElementById('messages').appendChild(item);
    });
    
  });
})


async function loadChatHistory(userId, otherUserId) {
  try {
    const response = await fetch(`/chat-history/${userId}/${otherUserId}`);
    const messages = await response.json();

    messages.forEach(message => {
      displayMessage(message, userId);
    });
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
}

function displayMessage(message, userId) {
  const messagesContainer = document.getElementById('messages');
  const item = document.createElement('li');

  // בדיקה האם המשתמש הוא השולח או המקבל
  if (message.senderId === userId) {
    item.classList.add("sender",'message');
    item.textContent = `${message.text}`;
  } else {
    item.classList.add("receiver", 'message');
    item.textContent = `${message.text}`;
  }

  messagesContainer.appendChild(item);
}

// קרא לפונקציה זו כאשר המשתמש מתחבר

