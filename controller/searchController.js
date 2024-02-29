
//searchcontroller
import {  CapitalizedName, loadUserName, getConnectedUserName, fetchUpdatedProfileImage } from "./functions.js";
export const selectedUsers = [];

export async function searchProfile(enableCheckboxes = false, searchInputId,searchMenuId) {
  const searchInput = document.getElementById(searchInputId);


    const name = searchInput.value;
    try {
      const response = await fetch(`/search?name=${name}`); 
      if (!response.ok) {
        throw new Error(`error in search req: ${response.status}`);
      }
      const data = await response.json();

      displaySearchResults(data.users, enableCheckboxes,searchMenuId );
    } catch (error) {
      console.error(error);
    }
  
}

export async function getImage(imageName) {
  const response = await fetch(`/getImage?imageName=${imageName}`);
  
  if (!response.ok) {
    throw new Error(` ${response.status}`);
  }
  const data = await response.json();
  return data.image;
}

function displaySearchResults(users, enableCheckboxes, searchMenuId) {
  if (users.length === 0) {
    searchResults.textContent = 'users not found';
  } else {
    const ul = document.getElementById(searchMenuId);

    ul.style.display = "block";
    ul.innerHTML='';
    
    users.forEach(async (user, index) => {
      const userName = document.createElement('span');
      const button = document.createElement('button');
      const profilePic = document.createElement('img');
  
      button.className = 'custom-button';
      profilePic.className = 'button-icon';
      userName.className = 'userName';
  
      button.id = `Pbutton${index + 1}`;

      if (!enableCheckboxes) {

      button.addEventListener('click', () => {
        window.location.href = '/profile?userId=' + user._id;
      });
    }
      
    else if (enableCheckboxes) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';

        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            selectedUsers.push(user._id);
          } else {
            const index = selectedUsers.findIndex((selectedUser) => selectedUser._id === user._id);
            if (index !== -1) {
              selectedUsers.splice(index, 1);
            }
          }
        });
        button.appendChild(checkbox);

      }


      profilePic.src = `data:image/jpeg;base64, ${await getImage(user.pphId)}`;
      userName.textContent = CapitalizedName(user.name);
  
      button.appendChild(userName);
      button.appendChild(profilePic);
  
      var br = document.createElement('br');
      ul.appendChild(br);
      ul.appendChild(button);

      
  });
  
    
  }
  document.body.addEventListener('click', (event) => {
    const searchMenu = document.getElementById(searchMenuId);
  
    // Check if the click is outside the search menu
    if (!searchMenu.contains(event.target)) {
      // If outside, hide the search menu
      searchMenu.style.display = 'none';
    }
  });
}


