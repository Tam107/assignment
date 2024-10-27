// Format the email date/time
document.querySelectorAll(".email-time").forEach((element) => {
  const timestamp = element.getAttribute("data-timestamp");
  const emailDate = new Date(timestamp);
  const now = new Date();
  const timeDifference = now - emailDate;
  const oneDay = 24 * 60 * 60 * 1000;

  if (timeDifference < oneDay) {
    const hours = emailDate.getHours();
    const minutes = emailDate.getMinutes().toString().padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHour = hours % 12 || 12;
    element.textContent = `${formattedHour}:${minutes} ${period}`;
  } else {
    const options = { month: "short", day: "numeric" };
    element.textContent = emailDate.toLocaleDateString("en-US", options);
  }
});

// Ensure the DOM is fully loaded before adding event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Select the delete button and attach event listener
  document
    .getElementById("deleteButton")
    .addEventListener("click", async () => {
      const selectedEmails = Array.from(
        document.querySelectorAll(".email-checkbox:checked")
      ).map((checkbox) =>
        checkbox.closest(".email-item").getAttribute("data-email-id")
      );

      if (selectedEmails.length === 0) {
        alert("Please select emails to delete.");
        return;
      }

      try {
        const response = await fetch("/api/delete-emails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailIds: selectedEmails }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          alert(errorText || "Failed to delete emails.");
          return;
        }

        const result = await response.json();
        alert(result.message || "Selected emails have been deleted.");

        // Remove the deleted emails from the DOM
        selectedEmails.forEach((id) => {
          const emailElement = document.querySelector(
            `.email-item[data-email-id="${id}"]`
          );
          if (emailElement) emailElement.remove();
        });
      } catch (error) {
        console.error("Error deleting emails:", error);
        alert("An error occurred while trying to delete emails.");
      }
    });
});
