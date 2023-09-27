document.addEventListener("DOMContentLoaded", () => {
    // כאשר הדף נטען, נשתמש ב-fetch כדי לקבל את שם המשתמש מהשרת
    fetch("/api/getUserName")
      .then((response) => response.json())
      .then((data) => {
        // הצג את שם המשתמש בדף
        const userName = data.userName;
        document.getElementById("userName").textContent = ` ${userName}`;
      })
      .catch((error) => {
        console.error("שגיאה בטעינת שם המשתמש:", error);
      });
  });