import {groupRegEventListeners,} from "../controller/groupController.js";
import {profileButton} from "../controller/profileController.js"
import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, CapitalizedName, getConnectedUserID, getConnectedUserName, friendsReqEventListeners } from "../controller/functions.js";

getConnectedUserName()
  .then(userName => {
    loadUserName('userName', userName); 
    getConnectedUserID()
    .then(userId => {
      fetchUpdatedProfileImage(userId,"small-profile-pic");
      friendsReqEventListeners(userId);
      profileButton(userId);
  
    })
    .catch(error => {
     console.error(error);
    });
  })
  .catch(error => {
   console.error(error);
  });
groupRegEventListeners();
