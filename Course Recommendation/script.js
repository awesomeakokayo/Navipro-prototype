// course.js

const container = document.querySelector(".recommended");

// Helper: convert ISO duration to human-readable
function formatDuration(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";
  const [, h, m, s] = match;
  return `${h ? h + "h " : ""}${m ? m + "m " : ""}${s ? s + "s" : ""}`.trim();
}

// Main loader
async function loadCourses(query) {
  container.innerHTML = "<p>Loading courses…</p>";

  try {
    const res = await fetch(
      `https://naviprobackend.onrender.com/api/week_videos`
    );
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>No courses found. Try another topic.</p>";
      return;
    }

    // Render cards
    container.innerHTML = "";
    data.forEach((course) => {
      const courseHTML = `
        <div class="course">
          <div class="left">
            <div class="video-image">
              <img src="${course.thumbnail}" alt="${course.title}">
            </div>
            <div class="video-details">
              <h3>${course.title}</h3>
              <div>
                <span>${course.channel}</span> •  
                <span>${formatDuration(course.duration)}</span> • 
                <span>👁️ ${course.views}</span>
              </div> 
              <div class="progress-container">
                <div class="progress-bar" style="width: 0%;"></div>
              </div>
            </div>
          </div>
          <div class="right">
            <a href="${course.url}" target="_blank">
              <button>Start</button>
            </a>
          </div>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", courseHTML);
    });
  } catch (err) {
    console.error("Error loading courses:", err);
    container.innerHTML =
      "<p>Failed to load courses. Please try again later.</p>";
  }
}

// Load default query on page load
window.addEventListener("DOMContentLoaded", () => {
  loadCourses("software engineering for beginners");
});

// (Optional) If you have a search input & button, hook them up:
// document.getElementById("searchBtn").addEventListener("click", () => {
//   const q = document.getElementById("searchInput").value.trim();
//   if (q) loadCourses(q);
// });
