

import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, CapitalizedName, getConnectedUserID, getConnectedUserName, friendsReqEventListeners } from "../controller/functions.js";
import {loadMorePosts, postsEventListeners} from "../controller/postsController.js"
import { groupsBtns } from "../controller/groupController.js";
import {profileButton} from "../controller/profileController.js"

getConnectedUserName()
  .then(userName => {
    loadUserName('userName', userName); // קריאה לפונקציה המשתמשת במזהה
    postsEventListeners('homepage', null);
    getConnectedUserID()
    .then(userId => {
      fetchUpdatedProfileImage(userId,"small-profile-pic");
      friendsReqEventListeners(userId);
      groupsBtns(userId);
      profileButton(userId);
      toggleUploadContainerVisibility(false);
      loadMorePosts(userId, userName,'homepage', null);
  
    })
    .catch(error => {
     console.error(error);
    });
  })
  .catch(error => {
   console.error(error);
  });
  
  



