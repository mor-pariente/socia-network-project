document.addEventListener("DOMContentLoaded", () => {
  // כאשר הדף נטען, נשתמש ב-fetch כדי לקבל את שם המשתמש מהשרת
  fetch("/api/getUserName") // get name of connected user
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // הצג את התמונה
      // הצג את שם המשתמש בדף
      const userName = data.userName;

      // מצא את הרווח הראשון בשם המשתמש
      const firstSpaceIndex = userName.indexOf(" ");

      if (firstSpaceIndex !== -1) {
        // שנה את האות הראשונה בשם המשתמש ובשם המשפחה להיות אות גדולה
        const firstName = userName.substring(0, firstSpaceIndex);
        const lastName = userName.substring(firstSpaceIndex + 1);

        const firstNameCapitalized =
          firstName.charAt(0).toUpperCase() + firstName.slice(1);
        const lastNameCapitalized =
          lastName.charAt(0).toUpperCase() + lastName.slice(1);

        // הצג את השם המשתמש בדף
        document.getElementById("userName").textContent = ` ${firstNameCapitalized} ${lastNameCapitalized}`;
        document.getElementById("userNameTitle").textContent = ` ${firstNameCapitalized} ${lastNameCapitalized}`;
      } else {
        // במקרה שאין רווח בשם, פשוט שנה את האות הראשונה להיות אות גדולה
        const userNameCapitalized =
          userName.charAt(0).toUpperCase() + userName.slice(1);
        document.getElementById("userName").textContent = ` ${userNameCapitalized}`;
        document.getElementById("userNameTitle").textContent = ` ${userNameCapitalized}`;
      }

      // קריאה לשרת נוספת לקבלת תמונת הפרופיל
      fetch("/api/getUserId") // get user id
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          console.log('here');
          return response.json();
        })
        .then((data) => {
          const userId = data.userId;
          console.log(userId);



          fetch(`/getProImgdByUserId?userId=${userId}`)
          .then((response) => response.text()) // החזר את התוכן כטקסט
          .then((imageBase64) => {
            // הצג את התמונה בתג img
            const imgElement = document.getElementById("profilePhoto");
            console.log(imageBase64);
            imgElement.src = `data:image/jpeg;base64,${imageBase64}`;
          })




          .catch((error) => {
            console.error("שגיאה בטעינת התמונה:", error);
            });
        })
        .catch((error) => {
          console.error("שגיאה בקבלת מזהה המשתמש:", error);
        });
    })
    .catch((error) => {
      console.error("שגיאה בטעינת שם המשתמש:", error);
    });
});



  // כאשר נלחץ על כפתור ההעלאה
  $('#uploadButton').click(function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        $('#message').text('אנא בחר קובץ תמונה להעלאה');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);

    $.ajax({
      url: '/upload-profile-image',
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
      success: async function(response) {
          $('#message').text(response.message);
    
         
      },
      error: function(error) {
          $('#message').text('שגיאה : ' + error.responseText);
      }
    });
});

