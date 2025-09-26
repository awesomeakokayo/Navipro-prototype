function getAuthHeaders(additional = {}) {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    null;

  const userId =
    localStorage.getItem("userId") || localStorage.getItem("user_id") || null;

  const headers = {
    "Content-Type": "application/json",
    ...additional,
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (userId) headers["X-User-ID"] = userId;

  return headers;
}

async function getWeeklyVideos() {
  if (!currentUserId) return null;
  try {
    const response = await fetch(
      "https://navipro-backend.onrender.com/api/week_videos",
      {
        headers: getAuthHeaders(),
      }
    );
    if (!response.ok) {
      console.error("Failed to get weekly videos", response.status);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error("Error fetching videos:", e);
    return null;
  }
}

// Helper: convert ISO duration to human-readable
function formatDuration(duration) {
  const match = (duration || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration || "";
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

async function displayWeeklyVideos() {
  const videoData = await getWeeklyVideos();
  const container = document.getElementById("videoContainer");
  if (!container) return;

  if (!videoData || !videoData.videos || videoData.videos.length === 0) {
    container.innerHTML = "<p>No videos available at the moment.</p>";
    return;
  }

  container.innerHTML = `
    <div class="video-content">
      ${videoData.videos
        .map(
          (video) => `
        <div style="display:flex;gap:10px;margin-bottom:15px;align-items:center;">
          <a href="${
            video.url
          }" target="_blank"><img class="video-cover" width="80" height="50" src="${
            video.thumbnail
          }" alt=""></a>
          <div class="video-about" style="flex:1;">
            <a class="video-title" href="${video.url}" target="_blank">${
            video.title
          }</a>
            <div class="video-detail">
              <span class="video-author">${video.channel} • </span>
              <span class="video-duration">${formatDuration(
                video.duration
              )}</span>
            </div>
          </div>
          <div class="ratings">
            <span class="star"><img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt=""></span>
            <span class="rating">${video.rating || 3.9}</span>
          </div>
        </div>`
        )
        .join("")}
    </div>
    <button id="refreshVideosBtn" class="refresh-btn">Refresh Videos</button>
  `;

  const refreshBtn = document.getElementById("refreshVideosBtn");
  if (refreshBtn)
    refreshBtn.addEventListener("click", async () => {
      container.innerHTML = "<p>Loading fresh video recommendations...</p>";
      await displayWeeklyVideos();
    });
}

// Listen for messages from parent (dashboard) — accepts { type: 'weeklyVideos', videos: [...] }
window.addEventListener('message', (event) => {
  try {
    const msg = event.data;
    if (!msg || msg.type !== 'weeklyVideos') return;
    const container = document.getElementById('videoContainer');
    if (!container) return;
    if (!msg.videos || msg.videos.length === 0) {
      container.innerHTML = '<p>No videos available.</p>';
      return;
    }
    // Render videos using same template
    container.innerHTML = `
      <div class="video-content">
        ${msg.videos
          .map(
            (video) => `
          <div style="display:flex;gap:10px;margin-bottom:15px;align-items:center;">
            <a href="${video.url}" target="_blank"><img class="video-cover" width="80" height="50" src="${video.thumbnail}" alt=""></a>
            <div class="video-about" style="flex:1;">
              <a class="video-title" href="${video.url}" target="_blank">${video.title}</a>
              <div class="video-detail">
                <span class="video-author">${video.channel} • </span>
                <span class="video-duration">${formatDuration(video.duration)}</span>
              </div>
            </div>
            <div class="ratings">
              <span class="star"><img width="15" height="15" src="https://img.icons8.com/?size=100&id=MVWV8hpGIZqp&format=png&color=FD7E14" alt=""></span>
              <span class="rating">${video.rating || 3.9}</span>
            </div>
          </div>`
          )
          .join('')}
      </div>
      <button id="refreshVideosBtn" class="refresh-btn">Refresh Videos</button>
    `;

    const refreshBtn = document.getElementById('refreshVideosBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', async () => {
      container.innerHTML = '<p>Loading fresh video recommendations...</p>';
      await displayWeeklyVideos();
    });
  } catch (e) {
    console.warn('Course Recommendation message handler error:', e);
  }
});

// Fallback: if no message arrives within 1.5s, call displayWeeklyVideos() to fetch from backend
setTimeout(() => {
  const container = document.getElementById('videoContainer');
  if (container && container.innerHTML.trim() === '') {
    displayWeeklyVideos();
  }
}, 1500);
