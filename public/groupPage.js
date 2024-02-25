import{getConnectedUserID,loadUserName,toggleUploadContainerVisibility, fetchUpdatedProfileImage, updateCoverImage, getConnectedUserName} from "../controller/functions.js"
import {friendsReqEventListeners} from "../controller/functions.js"
//import {profileButton,addEventListeners} from "./profileController.js"
import {loadMorePosts,postsEventListeners} from "../controller/postsController.js"

import { groupsBtns, initializeGroupPage, displayGroupMembers } from "../controller/groupController.js";

const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get('groupId');


$(document).ready(() => {
  postsEventListeners('group', groupId);
  getConnectedUserName()
    .then(connectedUsername => {
      loadUserName('userName', connectedUsername);
      getConnectedUserID()
        .then(userId => {
          initializeGroupPage(groupId,userId)
            .then(group => {
              toggleUploadContainerVisibility(false);
              loadMorePosts(userId, userName, 'group', groupId);
              displayGroupMembers(groupId, group.admin, userId);
              friendsReqEventListeners(userId);

            })
            .catch(error => {
              console.error(error);
            });
        });
    });
});