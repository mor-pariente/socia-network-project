
// postscontroller


import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, CapitalizedName, getConnectedUserID, getConnectedUserName, fetchUpdatedProfileImage2 } from "./functions.js";
import { searchProfile } from "./searchController.js";
import { profileButton } from "./profileController.js";

const uploadedFiles = [];






const uploadMedia = document.getElementById('upload-Media');
const fileInput = document.getElementById('postfileInput');

const uploadfileButton = document.getElementById('uploadfileButton');

const postButton = document.getElementById('post');

const postContent = document.getElementById('postContent');
const messageElement = document.getElementById('message');

const closeButton = document.getElementById('closeButton');





export function postsEventListeners ( originType, groupId){


uploadMedia.addEventListener('click', function () {
  toggleUploadContainerVisibility(true);
  fileInput.setAttribute('accept', 'image/*');
  

});
postButton.addEventListener('click', function () {
});
uploadfileButton.addEventListener('click', handleFileUpload);

const searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', function() {
  searchProfile(false, 'search-input', 'search-menu');
});

postButton.addEventListener('click', () => handlePost(originType, groupId));


uploadfileButton.addEventListener('click', function () {
  const previewContainer = document.getElementById('previewContainer');


  for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      // If it's an image file, display it
      
          const image = document.createElement('img');
          image.src = URL.createObjectURL(file);
          previewContainer.appendChild(image);
      
  }
});


closeButton.addEventListener("click", function () {
  toggleUploadContainerVisibility(false);
});


};

export function loadMorePosts(connectedUserId, connectedUserName, originType, groupId, profileId) {
    const postsContainer = $('#posts-container');
    const loadMoreButton = $('#load-more');
    let skip = 0;
    const postsPerLoad = 10;

    loadMoreButton.on('click', function () {
        loadMorePostsFromServer(skip, postsPerLoad, connectedUserId, connectedUserName, originType, groupId,profileId);
    });

    loadMorePostsFromServer(skip, postsPerLoad,connectedUserId, connectedUserName, originType, groupId,profileId);
};

// טעינת פוסטים מהשרת
function loadMorePostsFromServer(skip, limit, connectedUserId, connectedUserName, originType, groupId,profileId) {
  const urlParams = new URLSearchParams({
      skip, limit, originType, groupId, connectedUserId, profileId
  });

  $.ajax({
      url: `/get-posts?${urlParams.toString()}`,
      method: 'GET',
      success: function (data) {
          const posts = data.posts;
          handleLoadedPosts(posts, skip, limit, connectedUserId, connectedUserName);
      },
      error: function (error) {
          console.log('error fetching posts  :', error);
      }
  });
}


export function handleLoadedPosts(posts, skip, limit,connectedUserId, connectedUserName) {
    if (posts.length === 0) {
        $('#load-more').prop('disabled', true);
        $('#load-more').text('no more posts');
    } else {
        skip += limit;
        displayPosts(posts,connectedUserId, connectedUserName);
    }
};

// הצגת הפוסטים בקונטיינר
function displayPosts(posts, connectedUserId,connectedUserName) {
    const postsContainer = $('#posts-container');

    posts.forEach(post => {

        const postContainer = createPostElement(post,connectedUserId, connectedUserName);
        postsContainer.prepend(postContainer);
    });
};





function deletePost(postId) {
  $.ajax({
      url: `/delete-post/${postId}`,
      method: 'DELETE',
      success: function(response) {
          $(`#${postId}`).remove();
          alert('Post deleted successfully');
      },
      error: function(error) {
          alert('Error deleting post');
}
});
}





function createPostElement(post, connectedUserId, connectedUserName) {
    const postContainer = $('<div>', { 
      class: 'post',
      id: post._id  
  });  
    const prflBtnNContent = createprflBtnNContentContainer(post);
    const collage = createCollage(post);
    const commentDisplay = createCommentDisplay(post);
    const result = createLikesCommentsContainer(post, connectedUserId, connectedUserName);
    const likesCommentsContainer = result.container;
    const likes = result.likes;
    const comments = result.comments;
    if (connectedUserId === post.user._id) { 

      const editButton = $('<button>').text('Edit').addClass('white-custom-btn');
      const deleteButton = $('<button>').text('Delete').addClass('white-custom-btn');
      postContainer.append(editButton, deleteButton);

      deleteButton.on('click', () => deletePost(post._id));
      editButton.on('click', () => editPost(post));
  }

    comments.click(function(){
      if (commentDisplay.css('display') === 'none') {
        commentDisplay.css('display', 'block');
      } else {
        commentDisplay.css('display', 'none');
      }
    });
    const commentsContainer = $('<div>', { class: 'comments-container' });
    const singlePost = $('<div>', { class: 'single-post' });

    singlePost.append(prflBtnNContent);
    singlePost.append(collage);
    singlePost.append(likesCommentsContainer);


   const writeComment = createCommentTextArea();
  
    const postCommentBtn = createPostCommentButton(post, writeComment, commentDisplay, comments);

    commentsContainer.append(commentDisplay);
    commentsContainer.append(writeComment);
    commentsContainer.append(postCommentBtn);


    postContainer.append(singlePost);
    postContainer.append(commentsContainer);

    return postContainer;
  };
  
  function createprflBtnNContentContainer(post) {
    const prflBtnNContentContainer = $('<div>');

    const profileButton = $('<button>', { class: 'profileButtons' });
    const userNameElement = createUserNameElement(post.user.name);
    const profilePic = createProfilePic(post.user.profilePicBase64);
    const contentElement = $('<p>', { class: 'content', id: 'content'+post._id }).text(post.content);

    if (post.originType === 'plant' && post.plantDetails) {
        const plantDetailsElement = $('<div>', { class: 'plant-details' });
        const plantDetailsContent = `
            <strong>Plant Name:</strong> ${post.plantDetails.plantName}<br>
            <strong>Age:</strong> ${post.plantDetails.plantAge}<br>
            <strong>City:</strong> ${post.plantDetails.city}<br>
            <strong>Seasonality:</strong> ${post.plantDetails.seasonality}<br>
            <strong>Growth Conditions:</strong> ${post.plantDetails.growthConditions}<br>
            <strong>Difficulty Level:</strong> ${post.plantDetails.difficultyLevel}<br>
            <strong>Watering:</strong> ${post.plantDetails.watering}<br> 
            <strong>Price:</strong> ${post.plantDetails.price}<br>

        `;
        plantDetailsElement.html(plantDetailsContent);
        contentElement.append(plantDetailsElement); 
    }    
  
    profileButton.append(profilePic);
    profileButton.append(userNameElement);
    prflBtnNContentContainer.append(profileButton);
    prflBtnNContentContainer.append(contentElement);

    profileButton.on("click", () => {
      window.location.href = '/profile?userId=' + post.user._id;
    });
   
  
    return prflBtnNContentContainer;
  };
  
  function createUserNameElement(userName) {
    return $('<div>', { class: 'user-name-post' }).text(CapitalizedName(userName));
  };
  
  function createProfilePic(imageBase64) {
    return $('<img>', { class: 'profilePics', src: `data:image/jpeg;base64, ${imageBase64}` });
  }
  
  function createLikesCommentsContainer(post,userId, userName) {
    const likesCommentsContainer = $('<p>', { class: 'likesCommentsContainer' });
    const likes = createLikesButton((post.likes && post.likes.length) || 0);
    const comments = createCommentsButton((post.comments && post.comments.length) || 0);
  const likeButton = createLike(post, likes, userId, userName);

  likesCommentsContainer.append(likeButton);
    likesCommentsContainer.append(likes);
    likesCommentsContainer.append(comments);
  
    return {
      container: likesCommentsContainer,
      likes: likes,
      comments: comments,
    };  };
  
  function createLikesButton(likesCount) {
    return $('<button>', { class: 'likes custom-button' }).text(likesCount + ' likes');
  };


  function createLike(post, likes, userId, userName) {
    const likeButton = $('<button>', { class: 'like-button' });
    const likeIcon = $('<img>', {
      class: 'like-icon',
      src: "https://creazilla-store.fra1.digitaloceanspaces.com/emojis/54157/white-heart-emoji-clipart-md.png",
      alt: 'Like'});
  
    likeButton.append(likeIcon);
  
  
    likeButton.click(async function () {
    
      

      if (!post.likes.some(item => item.user === userId)) {
        $.ajax({
          type: 'POST',
          url: '/add-like',
          data: JSON.stringify({
            postId: post._id,
            userId: userId,
            userName: userName,
          }),
          contentType: 'application/json',
          success: function (newLike) {
            post.likes.push(newLike);
          
            likes.text(post.likes.length  + ' likes')

          },
          error: function (error) {
            console.error(error);
            alert('שגיאה בשמירת הלייק');
          },
        });
      } else {
        $.ajax({
          type: 'POST',
          url: '/remove-like', 
          data: JSON.stringify({
            postId: post._id,
            userId: userId,
          }),
          contentType: 'application/json',
          success: function (removedLike) {
            const index = post.likes.findIndex(item => item.user === userId);
            if (index !== -1) {
              post.likes.splice(index, 1);
            }
            likes.text(`${post.likes.length} likes`);
          },
          error: function (error) {
            console.error(error);
            alert('error removing like');
          },
        });
      }
    });
  
    return likeButton;
  };
  

  function createCommentsButton(commentsCount) {
    
   const button=  $('<button>', { class: 'comments custom-button' }).text(commentsCount + ' comments');

    return button;

  };
  
  function createTextCenter(post) {
    const textCenter = $('<div>', { class: 'text-center' });
    const writeComment = createCommentTextArea();
  
    textCenter.append(writeComment);

  
    return textCenter;
  };
  
  function createCommentTextArea() {
    return $('<textarea>', { class: 'comment-area' }).attr('placeholder', 'comment something...');
  };
  
  function createPostCommentButton(post, writeComment, commentDisplay, comments) {////////להוסיף כאן אפנד תגובה חדשה לדיספליי
    const postCommentBtn = $('<button>', { class: 'custom-button' }).text('Post Comment');
    postCommentBtn.click(async function () {
      // לקבל את התוכן של התגובה מהתיבת הטקסט
      const commentText = writeComment.val();
    
      // בדוק אם התוכן אינו ריק
      if (commentText.trim() === '') {
        alert('אנא הזן תוכן לתגובה');
        writeComment.val(''); 
        return;
      };
    
      const userId = await getConnectedUserID();
      const userName = await getConnectedUserName();
    
    
      $.ajax({
        type: 'POST',
        url: '/add-comment',
        data: JSON.stringify({
          postId: post._id,
          content: commentText,
          userId: userId,
          userName: userName,
        }),
        contentType: 'application/json',
        success: function (newComment) {

          const newCommentElement = createCommentElement(newComment);
      
          commentDisplay.append(newCommentElement);
          writeComment.val('');
          $(".comments").text(post.comments.length+1 + ' comments');
        },
        error: function (error) {
          console.error(error);
          alert('שגיאה בשמירת התגובה');
        },
      });
    });
    
    return postCommentBtn; 
  };
  
  
    function createCommentDisplay(post) {
      if (!post.comments) {
        return null; // or return an empty div or any other appropriate response
    }

      const commentDisplay = $('<div>', { class: 'comment-display' });
  
      post.comments.forEach((comment, index) => {
        const commentElement = createCommentElement(comment);
        commentDisplay.append(commentElement);
      });
      commentDisplay.css('display', 'none');
      return commentDisplay;
    };
  
    function createCommentElement(comment) {
      const commentElement = $('<p>', { class: 'comment-element'});

      const content = $('<div>', { text: comment.content });
      const prflBtn = createProfileButton(comment.userName, comment.user);
      const formattedDate = new Date(comment.created).toLocaleString();
      const timeStamp = createCommentTimestamp(formattedDate);
  
      commentElement.append(prflBtn);
      commentElement.append(content);

      commentElement.append(timeStamp);
  
      return commentElement;
    };
  
    export function createProfileButton(userName, userId) {
        const profilePic = $('<img>', { class: 'button-icon' });
        const usersName =$('<div>', { class: 'userName' }).text(`${userName}`);
      const prflBtn = $('<button>', { class: 'custom-button' });
      prflBtn.click(() => {
        window.location.href = '/profile?userId=' + userId;
      });
      fetchUpdatedProfileImage2(userId)

      .then(imageBase64 => {
        
        profilePic.attr('src', `data:image/jpeg;base64, ${imageBase64}`);


      })
      .catch(error => {
        console.error('error getting profile', error);
      });




      profilePic.appendTo(prflBtn);

    usersName.appendTo(prflBtn);
      return prflBtn;
    };
  
    function createCommentTimestamp(formattedDate) {
      return $('<p>', { class: 'comment-stamp', text: formattedDate });
    };
  
    function createCollage(post) {
      const collage = $('<div>', { class: 'collage' });
  
      post.mediaBase64.forEach((imageBase64, index) => {
        const imgElement = createImageElement(imageBase64, index);
        collage.append(imgElement);
      });
  
      return collage;
    };
  
    function createImageElement(imageBase64, index) {
      return $('<img>', {
        class: 'postImages',
        id: `img${index + 1}`,
        src: `data:image/jpeg;base64, ${imageBase64}`,
      });
    };
  
    
  
















// העלאת הקבצים למערך
function handleFileUpload() {
  const previewContainer = document.getElementById('previewContainer');
  previewContainer.innerHTML = ''; // Clear existing images

  if (fileInput.files.length === 0) {
      showMessage("Please select an image before uploading.");
      return;
  }

  if (uploadedFiles.length + fileInput.files.length > 5) {
      showMessage("You can upload up to 5 images only.");
      return;
  }

  // Add files to array and create preview images
  for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      uploadedFiles.push(file);

      // Create and display the preview image
      const image = document.createElement('img');
      image.src = URL.createObjectURL(file);
      previewContainer.appendChild(image);
  }

  messageElement.textContent = 'Files uploaded: ' + uploadedFiles.length;
  fileInput.value = "";
}

function getLocation() {
  return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
              position => {
                  const locationData = { 
                      type: 'Point', 
                      coordinates: [position.coords.latitude, position.coords.longitude] 
                  };
                  resolve(locationData);
              }, 
              error => {
                  reject(error);
              }
          );
      } else {
          reject("Geolocation is not supported by this browser.");
      }
  });
}

//post req to server
function handlePost( originType, groupId) {
    // check if theres content and no more them 5 files
    if (!['homepage', 'group', 'plant'].includes(originType)) {
      throw new Error('Invalid origin type. Must be either "homepage" or "group" or "plant".');
  }
  const formData = new FormData();

  if (originType != 'plant'){
    if (!postContent.value && uploadedFiles.length === 0) {
        showMessage("Oops! Seems like your post is empty, Write or upload something first! ");
        return;
    } else if (uploadedFiles.length > 5) {
        messageElement.textContent = 'MAX 5 FILES';
        return;
    }
    formData.append('postContent', postContent.value);

  }


    for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append('fileInput', uploadedFiles[i]);
    }

    formData.append('originType', originType);

    if(groupId){
    formData.append('groupId', groupId)};
    if(originType == 'plant') {
      const plantDetails = {
          plantName: document.getElementById('plantName').value,
          plantAge: document.getElementById('plantAge').value,
          city: document.getElementById('city').value,
          seasonality: document.getElementById('seasonality').value,
          growthConditions: document.getElementById('growthConditions').value,
          difficultyLevel: document.getElementById('difficultyLevel').value,
          watering: document.getElementById('watering').value,
          price: document.getElementById('price').value

      };
      for (let key in plantDetails) {
        if (!plantDetails[key]) {
            showMessage(`Please fill in the ${key} of the plant.`);
            return;
        }
    }
      formData.append('plantDetails', JSON.stringify(plantDetails)); // הוספת plantDetails כמחרוזת JSON
  }
    getLocation().then(locationData => {
      formData.append('location', JSON.stringify(locationData));
    $.ajax({
        url: '/upload',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            messageElement.textContent = data;
            window.location.reload();
        },
        error: function (error) {
            console.error('Error:', error);
        }
    });
  }).catch(error => {
    // location error
    console.error(error);
});
};


function showMessage(message) {
    document.getElementById("uploadMessage").style.display = "block";
    document.getElementById("Message").textContent = message;
    document.getElementById("OKButton").addEventListener("click", function () {
        document.getElementById("uploadMessage").style.display = "none";
    });
};





function editPost(post) {

  if ($(`#editForm_${post._id}`).length > 0) {
    $(`#editForm_${post._id}`).remove();
}

// יצירת טופס עריכה חדש
const editForm = $('<form>').addClass('edit-form').attr('id', `editForm_${post._id}`);
  // יצירת טופס עריכה עם התוכן הנוכחי של הפוסט


  const postElement = $("#" + post._id);
  const editTextarea = $('<textarea>').val(post.content).addClass('edit-textarea');
  const submitButton = $('<button>').text('OK').addClass('white-custom-btn');
  const cancelButton = $('<button>').text('Cancel').addClass('white-custom-btn');
  editForm.append(editTextarea, submitButton, cancelButton);

  // הוספת הטופס לדום, למשל מתחת לפוסט או בתוך דיאלוג מודאלי
  postElement.append(editForm);

  // הגדרת אירוע שליחת הטופס
  editForm.on('submit', function(e) {
      e.preventDefault(); // מונע את טעינת הדף מחדש

      const updatedContent = editTextarea.val();
      $.ajax({
          url: `/edit-post/${post._id}`,
          method: 'POST',
          data: { content: updatedContent },
          success: function(response) {
              // עדכון התוכן של הפוסט בדום
              $(`#content${post._id}`).text(updatedContent);
              editForm.remove(); // הסרת הטופס אחרי שינוי
              
          },
          error: function(error) {
              alert('שגיאה בעריכת הפוסט');
          }
      });
  });

  // אירוע לביטול העריכה
  cancelButton.on('click', function() {
      editForm.remove(); // הסרת הטופס
  });
}
