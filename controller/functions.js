

 //functions
 import {createProfileButton} from "./postsController.js"

export async function loadUserName(elementId, userName,) {
    
      const userNameElement = document.getElementById(elementId);
      userNameElement.textContent = CapitalizedName(userName);
   
  }

  export function getUser(userId) {
    return fetch(`/api/getUser?userId=${userId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(` ${response.status}`);
        }
        return response.json();
      })
      .then(data => data.user);
  };
  

export function CapitalizedName(userName) {
  
    let capitalizedUserName = ''; 
  
    const firstSpaceIndex = userName.indexOf(" ");
  
    if (firstSpaceIndex !== -1) {
        const firstName = userName.substring(0, firstSpaceIndex);
        const lastName = userName.substring(firstSpaceIndex + 1);
        const firstNameCapitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        const lastNameCapitalized = lastName.charAt(0).toUpperCase() + lastName.slice(1);
        capitalizedUserName = `${firstNameCapitalized} ${lastNameCapitalized}`;
    } else {
        const userNameCapitalized = userName.charAt(0).toUpperCase() + userName.slice(1);
        capitalizedUserName = userNameCapitalized;
    }
  
    return capitalizedUserName; 
  };
  




export async function getConnectedUserID() {
    try {
      const response = await fetch("/api/getUserId");
      
      if (!response.ok) {
        throw new Error(` ${response.status}`);
      }
  
      const data = await response.json();
      return data.userId;
    } catch (error) {
      console.error(error);
    }
  }
export async function getConnectedUserName() {
    try {
      const response = await fetch("/api/getConnectedUserName");
      
      if (!response.ok) {
        throw new Error(` ${response.status}`);
      }
  
      const data = await response.json();
      return data.userName;
    } catch (error) {
      console.error(error);
    }
};
export function fetchUpdatedProfileImage(userId, element) {
  
        
          const randomParam = new Date().getTime();
          fetch(`/getProfileImageByUserId?userId=${userId}&random=${randomParam}`)//random parameter so function will run again if needed
              .then((response) => {
                  if (!response.ok) {
                      throw new Error(`error reciving photo: ${response.statusText}`);
                  }
                  return response.json();
              })
              .then((data) => {
                  const imageBase64 = data.image;
                  updateProfileImage(imageBase64, element);
              })
              .catch((error) => {
                  console.error(error);
              });
     
};

export function fetchUpdatedCoverImage(userId) {
  
          const randomParam = new Date().getTime();

          fetch(`/getCoverImageByUserId?userId=${userId}&random=${randomParam}`)
              .then((response) => {
                  if (!response.ok) {
                      throw new Error(`error reciving photo: ${response.statusText}`);
                  }
                  return response.json();
              })
              .then((data) => {
                  const imageBase64 = data.image;
                  updateCoverImage(imageBase64);
              })
              .catch((error) => {
                  console.error(error);
              });
     
};

export async function fetchUpdatedProfileImage2(userId) {
  try {
    const randomParam = new Date().getTime();
    const response = await fetch(`/getProfileImageByUserId?userId=${userId}&random=${randomParam}`);
    if (!response.ok) {
      throw new Error(`error reciving photo: ${response.statusText}`);
    }
    const data = await response.json();
    const imageBase64 = data.image;
    return imageBase64;
  } catch (error) {
    console.error(error);
    throw error;
  }
};


function updateProfileImage(imageBase64, elementId) {
    const profileImage = document.getElementById(elementId);
    
        profileImage.src = `data:image/jpeg;base64, ${imageBase64}`;
    
};

export function updateCoverImage(imageBase64) {
  const coverImage = document.getElementById("coverPhoto");
  coverImage.src = `data:image/jpeg;base64, ${imageBase64}`;
};



export function toggleUploadContainerVisibility(visible) {
  const uploadContainer = document.getElementById("uploadContainer");
  uploadContainer.style.display = visible ? "block" : "none";
};

export function friendsReqEventListeners(userId) {
  const friendRequestsButton = document.getElementById('friendRequestsButton');
    const friendRequestsDropdown = document.getElementById('friendRequestsDropdown');
    friendRequestsButton.addEventListener('click', function(event) {
      toggleFriendRequests();
      loadFriendRequests(userId);
      event.stopPropagation(); // Prevent event from bubbling to the document
    });

    // Event listener for hiding the dropdown when clicking anywhere else
    document.addEventListener('click', function() {
      friendRequestsDropdown.style.display = 'none';
    });
};

function toggleFriendRequests() {
  friendRequestsDropdown.style.display = friendRequestsDropdown.style.display === 'none' ? 'block' : 'none';
}

// Load friend requests
export async function loadFriendRequests(userId) {
  try {
      const response = await fetch(`/getFriendsReq/${userId}`);
      
      if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      const friends = data.friendRequests;
      // Log friend requests

      // Get the container for friend requests
      const friendsRqContainer = document.getElementById('friendRequestsDropdown');
      
      // Clear existing content
      friendsRqContainer.innerHTML = '';

      // Loop through each friend request and create elements
      friends.forEach(friend => {
          createProfileButton(friend.name, friend.id).attr('class', 'custom-button').appendTo(friendsRqContainer);
          const confirm = $('<button>', { class: 'custom-button' }).appendTo(friendsRqContainer);
          const deletebtn = $('<button>', { class: 'custom-button' }).appendTo(friendsRqContainer);
          $('<br>').appendTo(friendsRqContainer);

          confirm.text('confirm');
          deletebtn.text('delete');

          confirm.on('click', function() {
              confirmReq(friend.id, userId);
          });
          deletebtn.on('click', function() {
              deleteReq(friend.id, userId);
          });
      }); // End of forEach loop
  } catch (error) {
      console.error('Error:', error);
  }
} // End of loadFriendRequests function




async function confirmReq(requesterId, acceptorId) {
  try {
      const response = await fetch('/api/confirmFriendRequest', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              // Add authentication headers if needed
          },
          body: JSON.stringify({ requesterId, acceptorId })
      });

      if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Update UI accordingly
  } catch (error) {
      console.error('Error:', error);
  }
}

async function deleteReq(requesterId, acceptorId) {
  try {
      const response = await fetch('/api/deleteFriendRequest', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              // Add authentication headers if needed
          },
          body: JSON.stringify({ requesterId, acceptorId })
      });

      if (!response.ok) {
          throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Update UI accordingly
  } catch (error) {
      console.error('Error:', error);
  }
}

export function sendFriendRequest(connectedUserId, potentialFriendId) {
  const authToken = localStorage.getItem('googleAuthToken'); // Retrieve the token

  fetch('/api/addFriend', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}` // Include the token in the headers
      },
      body: JSON.stringify({ friendId: potentialFriendId, userId: connectedUserId })
  })
  .then(response => response.json())
  .then(data => {
      // Update the UI accordingly
  })
  .catch(error => console.error('Error:', error));
}
