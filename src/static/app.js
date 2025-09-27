document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const searchInput = document.getElementById("activity-search");
  const sortSelect = document.getElementById("activity-sort");
  const categorySelect = document.getElementById("activity-category");

  let allActivities = {};
  let allCategories = new Set();

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      // Collect categories if present
      allCategories = new Set();
      Object.values(activities).forEach((details) => {
        if (details.category) allCategories.add(details.category);
      });
      renderCategoryFilter();
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderCategoryFilter() {
    if (allCategories.size > 0) {
      categorySelect.style.display = "inline-block";
      categorySelect.innerHTML = `<option value="">All Categories</option>` +
        Array.from(allCategories)
          .map((cat) => `<option value="${cat}">${cat}</option>`)
          .join("");
    } else {
      categorySelect.style.display = "none";
    }
  }

  function renderActivities() {
    // Get filter values
    const search = searchInput.value.trim().toLowerCase();
    const sortBy = sortSelect.value;
    const category = categorySelect.value;

    // Clear previous
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Filter and sort
    let entries = Object.entries(allActivities);
    if (category) {
      entries = entries.filter(([_, d]) => d.category === category);
    }
    if (search) {
      entries = entries.filter(([name, d]) =>
        name.toLowerCase().includes(search) ||
        (d.description && d.description.toLowerCase().includes(search))
      );
    }
    if (sortBy === "name") {
      entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else if (sortBy === "schedule") {
      entries.sort((a, b) => (a[1].schedule || "").localeCompare(b[1].schedule || ""));
    }

    if (entries.length === 0) {
      activitiesList.innerHTML = '<p>No activities found.</p>';
      return;
    }

    entries.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Import the add function from addition.js
  // If using modules, uncomment the next line:
  // import { add } from './addition.js';

  // For demonstration, include addition.js in index.html before app.js, then use add directly
  console.log('2 + 3 =', add(2, 3)); // Should output: 2 + 3 = 5

  // Event listeners for controls
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (sortSelect) sortSelect.addEventListener("change", renderActivities);
  if (categorySelect) categorySelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
});
