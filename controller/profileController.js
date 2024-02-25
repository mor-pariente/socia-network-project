//profilecontroller

import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, getConnectedUserID,fetchUpdatedCoverImage, getUser, getConnectedUserName, sendFriendRequest } from "./functions.js";
import { searchProfile } from "./searchController.js";



var updatePImageFlag = { value: false };  
var updateCImageFlag = { value: false };

function updateImageFlag(flagObject, containerName) {
  flagObject.value = true;  

  toggleUploadContainerVisibility(true, containerName);
};

export function addEventListeners(userId) {
  $('#chat-with').click(function() {
    $('#chat-container').toggle();
});
  const updateProfilePhotoButton = document.getElementById("updateProfilePhotoButton");
  const updateCoverPhotoButton = document.getElementById("updateCoverPhotoButton");
  const uploadButton = document.getElementById("uploadButton");
  const closeButton = document.getElementById("closeButton");
  profileButton();
  
  if(updateProfilePhotoButton){
  updateProfilePhotoButton.addEventListener("click", () => updateImageFlag(updatePImageFlag, "profile"));}

  if(updateCoverPhotoButton){
  updateCoverPhotoButton.addEventListener("click", () => updateImageFlag(updateCImageFlag, "cover"));}
  
  uploadButton.addEventListener("click", () => uploadImage(userId));
  closeButton.addEventListener("click", () => toggleUploadContainerVisibility(false));

};


function uploadImage(userId) {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    $('#message').text('select photo to upload');
    return;
  }

  const formData = new FormData();
  formData.append('image', file);

  if (updatePImageFlag.value) {
    uploadImageToServer('/upload-profile-image', formData, fetchUpdatedProfileImage, userId);
    updatePImageFlag.value = false;
  } else if (updateCImageFlag.value) {
    uploadImageToServer('/upload-cover-image', formData, fetchUpdatedCoverImage,userId);
    updateCImageFlag.value = false; 
  }
  else if (updateCImageFlag.value) {
    uploadImageToServer('/upload-cover-image', formData, fetchUpdatedCoverImage,userId);
    updateCImageFlag.value = false; 
  }
};

function uploadImageToServer(url, formData, fetchImage, userId) {
  $.ajax({
    url: url,
    type: 'POST',
    data: formData,
    contentType: false,
    processData: false,
    success: async function (response) {
      $('#message').text(response.message);
      fetchImage(userId, 'profilePhoto');
      toggleUploadContainerVisibility(false);
    },
    error: function (error) {
      $('#message').text('שגיאה : ' + error.responseText);
    }
  });
};

export function initializePage(userId) {
 
  const searchButton = document.getElementById('search-button');
  searchButton.addEventListener('click', function() {
    searchProfile(false, 'search-input', 'search-menu');
  });


  getUser(userId)
    .then(user => {
      getConnectedUserName()
      .then(connectedUsername=> {
        loadUserName('userName',connectedUsername);

      });

      loadUserName('userNameTitle', user.name);
      getConnectedUserID()
        .then(connectedUserId => {
          if (userId == connectedUserId) {
            document.getElementById("updateProfilePhotoButton").style.display = "block";
            document.getElementById("updateCoverPhotoButton").style.display = "block";
            document.getElementById("addFriend").style.display = "none";
            document.getElementById("deleteAccountButton").style.display = "block";
        document.getElementById("deleteAccountButton").addEventListener("click", deleteAccount);

          }
          else if (userId != connectedUserId) 
          {
            document.getElementById("addFriend").style.display = "block";
            addFriend.addEventListener("click", () => sendFriendRequest(connectedUserId, userId));

          }
          
          fetchUpdatedProfileImage(user._id, "profilePhoto" );
          fetchUpdatedProfileImage(connectedUserId, "small-profile-pic");
          fetchUpdatedCoverImage(user._id);
        })
        .catch(error => {
          console.error(error);
        });
    })
    .catch(error => {
      console.error(error);
    });
};



export function profileButton(userId) {
  const profileBtn = document.getElementById('profileBtn'); 
  
  profileBtn.addEventListener("click", () => {
        window.location.href = '/profile?userId=' + userId; 

     
  });
};

function deleteAccount() {
  if (confirm("Are you sure you want to delete your account? This cannot be undone.")) {
    $.ajax({
      url: '/api/delete-account',
      type: 'DELETE',
      success: function(response) {
        alert("Your account has been deleted.");
        window.location.href = '/logout';
      },
      error: function(error) {
        alert("Error: " + error.responseText);
      }
    });
  }
}
