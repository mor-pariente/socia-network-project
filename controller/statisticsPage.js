import {createProfileButton} from "./postsController.js"
import {profileButton} from "./profileController.js"
import { loadUserName, fetchUpdatedProfileImage, toggleUploadContainerVisibility, CapitalizedName, getConnectedUserID, getConnectedUserName, friendsReqEventListeners } from "./functions.js";

getConnectedUserName()
  .then(userName => {
    loadUserName('userName', userName); // קריאה לפונקציה המשתמשת במזהה
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

  window.initMap = initMap;
  initMap();

   async function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: { lat: 31.9660148, lng: 34.7725601 } 
    });

    fetch('/api/posts-with-location')
      .then(response => response.json())
      .then(posts => {
        posts.forEach(post => {
          if(post.location && post.location.type === "Point" && post.location.coordinates.length === 2) {
            // קואורדינטות הן בסדר [latitude, longitude]
            const latLng = new google.maps.LatLng(post.location.coordinates[0], post.location.coordinates[1]);
  
            new google.maps.Marker({
              position: latLng,
              map: map,
              title: post.title
            });
          }
        });
      })
      .catch(error => console.error('Error loading map markers:', error));
  }
  

  

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  function loadUserPostCounts() {
      $.ajax({
          url: '/api/user-post-count', 
          method: 'GET',
          success: function(data) {
              displayUserPostCounts(data); 
              drawPieChart(data); 
          },
          error: function(error) {
              console.error('Error fetching user post counts:', error);
          }
      });
  }
  
  function displayUserPostCounts(userPostCounts) {
      const list = $('<ul>');
      userPostCounts.forEach(userPostCount => {
          const listItem = $('<li>');
          const postCountElement = $('<span>').text(`Posts: ${userPostCount.postCount}`);
          postCountElement.css('color', colorScale(userPostCount.userName));
          const profileButton = createProfileButton(userPostCount.userName, userPostCount._id);
  
          listItem.append(profileButton, postCountElement);
          list.append(listItem);
      });
  
      $('#user-post-counts-container').empty().append(list);
  }
  
  function drawPieChart(data) {
      const width = 450;
      const height = 450;
      const radius = Math.min(width, height) / 2;
  
      const svg = d3.select('#pie-chart')
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .append('g')
          .attr('transform', `translate(${width / 2}, ${height / 2})`);
  
      const pie = d3.pie().value(d => d.postCount);
  
      const arc = d3.arc()
          .innerRadius(0)
          .outerRadius(radius);
  
      const arcs = svg.selectAll('arc')
          .data(pie(data))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', d => colorScale(d.data.userName)); 
  
      arcs.append('text')
          .attr("transform", function(d) {
              return `translate(${arc.centroid(d)})`;
          })
          .attr("dy", "0.35em")
          .style("text-anchor", "middle")
          .text(d => d.data.userName);
  }
  
  loadUserPostCounts();


  d3.json('/api/post-count-per-month').then(data => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    data.forEach(d => {
      d.monthName = `${months[d._id.month - 1]} ${d._id.year}`;
      d.value = d.postCount;
    });
  
    const margin = { top: 20, right: 20, bottom: 80, left: 40 },
          width = 960 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;
  
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.monthName))
        .padding(0.1);
  
    const y = d3.scaleLinear()
    .range([height, 0])
    .domain([0, d3.max(data, d => d.value)]);

  
    const svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
  
   
    svg.selectAll(".bars")
    .data(data)
    .enter().append("rect")
      .attr("class", "bars")
      .attr("x", d => x(d.monthName)) 
      .attr("width", x.bandwidth()) 
      .attr("y", d => y(d.value)) 
      .attr("height", d => height - y(d.value)); 
  
  
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")  
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)");
  
  svg.append("g")
  .call(d3.axisLeft(y).ticks(d3.max(data, d => d.value)).tickFormat(d3.format("d")));
  });

