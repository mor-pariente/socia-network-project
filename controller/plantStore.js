

import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, CapitalizedName, getConnectedUserID, getConnectedUserName, friendsReqEventListeners } from "./functions.js";
import {loadMorePosts, postsEventListeners, handleLoadedPosts} from "./postsController.js"
import { groupsBtns } from "./groupController.js";
import {profileButton} from "./profileController.js"

getConnectedUserName()
  .then(userName => {
    loadUserName('userName', userName); 
    postsEventListeners('plant', null);
    getConnectedUserID()
    .then(userId => {
      fetchUpdatedProfileImage(userId,"small-profile-pic");
      friendsReqEventListeners(userId);
      profileButton(userId);
      toggleUploadContainerVisibility(false);
      loadMorePosts(userId, userName,'plant', null);
      getWeather();
      const searchPlant = document.getElementById('search-plant');
      searchPlant.addEventListener('click', function () {
        searchPlants(userId,userName);
      });
    })
    .catch(error => {
     console.error(error);
    });
  })
  .catch(error => {
   console.error(error);
  });
  
  // Call getWeather on page load or based on a specific event





  function searchPlants(connectedUserId, connectedUserName) {
    const plantName = document.getElementById('search-plantName').value;
    const plantAge = document.getElementById('search-plantAge').value;
    const city = document.getElementById('search-city').value;
    const seasonality = document.getElementById('search-seasonality').value;
    const growthConditions = document.getElementById('search-growthConditions').value;
    const difficultyLevel = document.getElementById('search-difficultyLevel').value;
    const watering = document.getElementById('search-watering').value;
    const minPrice = document.getElementById('search-minPrice').value;
    const maxPrice = document.getElementById('search-maxPrice').value;

    const queryParams = new URLSearchParams({
        plantName,
        plantAge,
        city,
        seasonality,
        growthConditions,
        difficultyLevel,
        watering,
        minPrice,
        maxPrice
    }).toString();


    $.ajax({
      url: `/search-plants?${queryParams}`,
      method: 'GET',
      success: function (data) {
          const posts = data.posts;
          const postsContainer = $('#posts-container');
          postsContainer.html('');
          handleLoadedPosts(posts, 0, posts.length, connectedUserId, connectedUserName);
      },
      error: function (error) {
          console.log('error fetching plant search results', error);
      }
  });

    
}




// Function to get the user's location and fetch weather data
export function getWeather() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          fetchWeather(lat, lon);
      }, () => {
          document.getElementById('weather-info').textContent = 'Unable to access your location';
      });
  } else {
      document.getElementById('weather-info').textContent = 'Geolocation is not supported by this browser.';
  }
}

// Function to fetch weather data from OpenWeatherMap
function fetchWeather(lat, lon) {
  const apiKey = "86217e403593c1c5b8834395104e0a38"
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  fetch(url)
      .then(response => response.json())
      .then(data => {
          displayWeather(data);
      })
      .catch(error => {
          console.error('Error fetching weather data:', error);
          document.getElementById('weather-info').textContent = 'Error fetching weather data';
      });
}

// Function to display weather data
function displayWeather(data) {
  const temp = data.main.temp;
  const weatherDescription = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;

  document.getElementById('weather-icon').src = iconUrl;
  document.getElementById('temperature').innerHTML = `Temperature: ${temp}&deg;C`;
  document.getElementById('weather-description').textContent = weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1);
}


