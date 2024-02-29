
//groupController
import {
  searchProfile,
  selectedUsers,
  getImage
} from "./searchController.js";
import {
  
  getConnectedUserID,
  loadUserName,
  fetchUpdatedProfileImage,
  updateCoverImage
} from "./functions.js";
import {profileButton} from "./profileController.js"

import {createProfileButton} from "./postsController.js"
let isManagerLoggedIn = false;


// Search button click event
export function groupRegEventListeners(){
const searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', function () {
  searchProfile(false,'search-input','search-menu');
});

const addParticipantsSearchButton = document.getElementById('add-participants-search-button');
addParticipantsSearchButton.addEventListener('click', function () {
  searchProfile(true,'add-participants-search-input','add-participants-search-menu');

});
// Check if registration form exists before adding event listener
const registrationForm = document.getElementById("registration-form");

if (registrationForm) {
  registrationForm.addEventListener("submit", handleRegistration);
};
};


// Handle registration form submission
function handleRegistration(event) {
  event.preventDefault();

  // Get form values
  const groupName = document.getElementById("groupName").value;
  const adminUsername = document.getElementById("adminUsername").value;
  const adminPassword = document.getElementById("adminPassword").value;
  getConnectedUserID()
  .then(userId => {
    const adminUserId = userId;  
  
  
  // Get connected user ID

  // Create group using AJAX
  $.ajax({
    type: 'POST',
    url: '/create-group',
    data: JSON.stringify({
      groupName: groupName,
      adminUserId: adminUserId,
      adminUsername: adminUsername,
      adminPassword: adminPassword,
      participants: selectedUsers
    }),
    contentType: 'application/json',
    success: function () {
      window.location.href = "/home"; // Redirect to home page after creating the group
    },
    
    error: function (error) {
      console.error(error);
      alert('error in creating group');
    },
  });

  // Log selected users
})
.catch(error => {
 console.error(error);
});
};




// Function to fetch and log user groups
export async function groupsBtns(connectedUserID) {
  try {
    const groups = await getMyGroups(connectedUserID);
    const promises = groups.map(group => createGroupBttn(group, connectedUserID));
    await Promise.all(promises);
  } catch (error) {
    console.error(error);
  }
};


// Function to get user groups
export function getMyGroups(userId) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`/getMyGroups?userId=${userId}`);

      if (!response.ok) {
       console.log('no groups');
      }

      const data = await response.json();
      resolve(data);
    } catch (error) {
      console.log(error);

    }
  });
};





async function createGroupBttn(group, userId) {
  const groupsContainer = document.getElementById('groups-container');

  const groupPic = new Image();
  groupPic.className = 'button-icon';
  //groupPic.src = `data:image/jpeg;base64, ${await getImage(group.coverPhoto)}`;

  const groupName = document.createElement('div');
  groupName.className = 'userName';
  groupName.textContent = group.groupName;

  const groupBtn = document.createElement('button');
  groupBtn.className = 'white-custom-btn';

  groupBtn.addEventListener('click', () => {
    window.location.href = '/group?groupId=' + group._id; 
   });

  groupBtn.appendChild(groupPic);
  groupBtn.appendChild(groupName);

  groupsContainer.appendChild(groupBtn);
};



export async function initializeGroupPage(groupId, userId) {
  profileButton(userId);
  const searchButton = document.getElementById('search-button');
searchButton.addEventListener('click', function () {
  searchProfile(false,'search-input','search-menu');

});

$('#managerLoginButton').click(function() {
  $('#managerLoginForm').toggle();

});


const addParticipantsSearchButton = document.getElementById('add-participants-search-button');
addParticipantsSearchButton.addEventListener('click', function () {
  searchProfile(true,'add-participants-search-input','add-participants-search-menu');

});

  try {
    const group = await getGroup(groupId,userId);
    const submitButton = document.getElementById('submit');
    submitButton.addEventListener('click', function () {
      addMembers(selectedUsers, groupId, group.admin);
      displayGroupMembers(groupId,group.admin);
      
    });

    loadUserName('userNameTitle', group.groupName);
    
    managerLogIn(groupId, group.admin);

    
    fetchUpdatedProfileImage(userId, "small-profile-pic");
    
    return group;
  } catch (error) {
    console.error(error);
  }
}

async function managerLogIn(groupId,groupAdmin)
{
  $('#managerLoginForm').submit(function(e) {
    e.preventDefault();
    const username = $('#managerUsername').val();
    const password = $('#managerPassword').val();

    $.ajax({
        url: '/api/manager-login',
        method: 'POST',
        data: {
            groupId: groupId,
            username: username,
            password: password
        },
        success: function(response) {
            if (response.isManager) {
              $('#managerLoginForm').toggle();
              isManagerLoggedIn=true;
              displayGroupMembers(groupId,groupAdmin)



            } else {
                alert('error loging in ');
            }
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
});
}


export async function getGroup(groupId, userId){
  const response = await fetch(`/api/getGroup?groupId=${groupId}&userId=${userId}`);
  if (!response.ok) {
  throw new Error(`${response.status}`);
}
const data = await response.json();
return data.group;
};

export async function displayGroupMembers(groupId, groupAdmin) {
  try {
    const timestamp = new Date().getTime();

    const response = await fetch(`/getGroupMembers/${groupId}?timestamp=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }

    const data = await response.json();
    const members = data.members;


    const membersContainer = document.getElementById('members-list');
    const removeContainer = document.getElementById('remove-list');
    const addContainer = document.getElementById('add-participants-search-container');
    removeContainer.innerHTML = '';  

    membersContainer.innerHTML = ''; 
      members.forEach(member => {
        createProfileButton(member.name, member._id).attr('class', 'white-custom-btn').appendTo(membersContainer);
        if(isManagerLoggedIn){
        const remove = $('<button>', { class: 'remove-btn' });
        remove.text('-');
        remove.appendTo(removeContainer);
        if (member._id!= groupAdmin)
        remove.on('click', function() {
          removeMember(member._id,groupId,groupAdmin);
        });}
});
    
  if(isManagerLoggedIn){
    const removeBtn = $('<button>', { class: 'white-custom-btn' });
    removeBtn.text(' remove participants - ');
    const addBtn = $('<button>', { class: 'white-custom-btn' });
    addBtn.text(' add participants + ');
    const deleteG = $('<button>', { class: 'white-custom-btn' });
    deleteG.text(' delete group ');
    deleteG.on('click', function() {
      deleteGroup(groupId);
    });
        $('<br>').appendTo(membersContainer);
    removeBtn.on('click', function() {
      var displayStyle = removeContainer.style.display;

      if (displayStyle === 'none' || displayStyle === '') {
        removeContainer.style.display = 'flex';
      } else {
        removeContainer.style.display = 'none';
      }
    });
    removeBtn.appendTo(membersContainer);

    addBtn.on('click', function() {
      var displayStyle = addContainer.style.display;

      if (displayStyle === 'none' || displayStyle === '') {
        addContainer.style.display = 'flex';
      } else {
        addContainer.style.display = 'none';
      }
    });
    addBtn.appendTo(membersContainer);
    deleteG.appendTo(membersContainer);

  }



  } catch (error) {
    console.error(error);
  }
}
export function removeMember(memberId, groupId,groupAdmin) {
  fetch(`/removeMember?memberId=${memberId}&groupId=${groupId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      displayGroupMembers(groupId,groupAdmin)
    })
    .catch(error => {
      console.error('Error removing member:', error);
    });
}

export async function deleteGroup (groupId){
  {
    try {
      const response = await fetch(`/group/${groupId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Group deleted successfully');
        window.location.href = '/home';
      } else {
        alert('Failed to delete group');
      }
    } catch (error) {
      alert('Error occurred while deleting group');
    }
  };
}

export function addMembers(members, groupId,groupAdmin) {
  $.ajax({
    type: 'POST',
    url: '/add-members',
    data: JSON.stringify({
     
      groupId: groupId,
      participants: members
    }),
    contentType: 'application/json',
    success: function () {
      

    },
    
    error: function (error) {
      console.error(error);
      alert('error in adding members to group');
    },
  });

};