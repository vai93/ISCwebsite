const sidebar = document.getElementById("mobileSidebar");
const toggleBtn = document.getElementById("sidebarToggle");
const closeBtn = document.getElementById("sidebarClose");

toggleBtn.addEventListener("click", () => sidebar.classList.add("show"));
closeBtn.addEventListener("click", () => sidebar.classList.remove("show"));

document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
    sidebar.classList.remove("show");
  }
});

const cards = document.querySelectorAll(".welding-card");
cards.forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.classList.remove("hover-out");
    card.classList.add("hover-in");
  });
  card.addEventListener("mouseleave", () => {
    card.classList.remove("hover-in");
    card.classList.add("hover-out");
  });
});

function renderJobListings(jobsData) {
  const accordionContainer = document.getElementById("careerAccordion");

  if (!jobsData || jobsData.length === 0) {
    accordionContainer.innerHTML =
      '<p class="text-center text-muted">No openings are available at the moment, but you can still submit your application below.</p>';
    return;
  }

  let accordionHTML = "";
  jobsData.forEach((job, index) => {
    const isFirst = index === 0;
    const collapseId = `job${index}`;
    const headingId = `heading${index}`;

    let responsibilitiesHTML = "";
    if (job["Key Responsibilities"]) {
      const responsibilities = String(job["Key Responsibilities"])
        .split(";")
        .filter((r) => r.trim() !== "");
      if (responsibilities.length > 0) {
        responsibilitiesHTML += `<h6>Key Responsibilities:</h6><ul>`;
        responsibilities.forEach((responsibility) => {
          responsibilitiesHTML += `<li>${responsibility.trim()}</li>`;
        });
        responsibilitiesHTML += `</ul>`;
      }
    }

    accordionHTML += `
      <div class="accordion-item fade-in" style="transition-delay: ${index * 0.2}s;">
        <h2 class="accordion-header" id="${headingId}">
          <button class="accordion-button ${isFirst ? "" : "collapsed"}" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#${collapseId}" 
                  aria-expanded="${isFirst}" 
                  aria-controls="${collapseId}">
            <div class="job-title-wrapper">
              <h5>${job.heading || "N/A"}</h5>
              <span class="job-meta">${job.subheading || ""}</span>
            </div>
            <i class="fas ${isFirst ? "fa-caret-up" : "fa-caret-down"} accordion-icon"></i>
          </button>
        </h2>
        <div id="${collapseId}" 
             class="accordion-collapse collapse ${isFirst ? "show" : ""}" 
             aria-labelledby="${headingId}" 
             data-bs-parent="#careerAccordion">
          <div class="accordion-body">
            ${
              job["Job Description"]
                ? `<h6>Job Description:</h6><p>${job["Job Description"]}</p>`
                : ""
            }
            ${responsibilitiesHTML}
            <button class="btn apply-now-btn" data-job-title="${job.heading || ""}">
              <i class="fas fa-paper-plane me-2"></i>Apply Now
            </button>
          </div>
        </div>
      </div>
    `;
  });
  accordionContainer.innerHTML = accordionHTML;
}

function setupEventListeners() {
  document.querySelectorAll(".apply-now-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const jobTitle = btn.dataset.jobTitle;
      document.getElementById("position").value = jobTitle;
      document
        .getElementById("applynow")
        .scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  const accordionItems = document.querySelectorAll(".accordion-collapse");
  accordionItems.forEach((item) => {
    const headerButton = item.previousElementSibling.querySelector("button");
    const icon = headerButton.querySelector(".accordion-icon");

    item.addEventListener("show.bs.collapse", () => {
      icon.classList.remove("fa-caret-down");
      icon.classList.add("fa-caret-up");
    });

    item.addEventListener("hide.bs.collapse", () => {
      icon.classList.remove("fa-caret-up");
      icon.classList.add("fa-caret-down");
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
}

const GOOGLE_SHEET_ID = "1VNIqtk4GKd12UCTifImxvfcy622Rhox5ZJ9WzC4kA1g";
const GOOGLE_SHEET_GID = "0";

async function fetchJobsDataFromSheet() {
  // Uses the lightweight Google Visualization API endpoint to read shared rows.
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&gid=${GOOGLE_SHEET_GID}`;
  const response = await fetch(sheetUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Network response was not ok: ${response.statusText}`);
  }

  const text = await response.text();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Could not parse Google Sheets response");
  }

  const payload = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  const table = payload.table || { cols: [], rows: [] };
  const providedLabels = table.cols.map((col) => (col.label || "").trim());
  let columns = providedLabels.map(
    (label, index) => label || table.cols[index]?.id || `Column_${index}`
  );
  let rows = table.rows || [];

  // If Google didn't promote the first row to headers, use the first row manually.
  const hasProvidedLabels = providedLabels.some((label) => label.length > 0);
  if (!hasProvidedLabels && rows.length > 0) {
    columns = rows[0].c.map((cell, index) => {
      const headerValue = (cell?.v ?? "").toString().trim();
      return headerValue || table.cols[index]?.id || `Column_${index}`;
    });
    rows = rows.slice(1);
  }

  return rows
    .map((row) => {
      const job = {};
      columns.forEach((colName, idx) => {
        job[colName] = row.c[idx]?.v ?? "";
      });
      return job;
    })
    .filter((job) =>
      ["heading", "subheading", "Job Description", "Key Responsibilities"].some(
        (key) => job[key] && String(job[key]).trim() !== ""
      )
    );
}

async function loadJobsAndInitialize() {
  try {
    const jobsData = await fetchJobsDataFromSheet();
    renderJobListings(jobsData);
    setupEventListeners();
  } catch (error) {
    console.error("Error loading job data:", error);
    const accordionContainer = document.getElementById("careerAccordion");
    accordionContainer.innerHTML = `<p class="text-center text-danger">Could not load job openings. You can still submit your application below.</p>`;
  }
}

function initializeStaticHandlers() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

  const fileInput = document.getElementById("resume");
  const filenameDisplay = document.querySelector(".file-upload-filename");
  fileInput.addEventListener("change", () => {
    if (fileInput.files.length > 0) {
      filenameDisplay.textContent = fileInput.files[0].name;
    } else {
      filenameDisplay.textContent = "No file selected...";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeStaticHandlers();
  loadJobsAndInitialize();
});

(function () {
  const btn = document.getElementById("backToTop");
  if (!btn) return;

  const isScrollable = () =>
    document.documentElement.scrollHeight > window.innerHeight + 10;

  const SCROLL_TRIGGER = Math.round(window.innerHeight * 0.15);

  function toggleBackToTop() {
    if (
      isScrollable() &&
      (window.scrollY || document.documentElement.scrollTop) > SCROLL_TRIGGER
    ) {
      btn.classList.add("show");
    } else {
      btn.classList.remove("show");
    }
  }

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  });

  window.addEventListener("load", toggleBackToTop, { once: true });
  window.addEventListener("resize", toggleBackToTop);
  window.addEventListener("scroll", toggleBackToTop, { passive: true });
})();

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const submitBtn = form.querySelector("button[type='submit']");
  const fileInput = document.getElementById("resume");
  const fileNameDisplay = document.querySelector(".file-upload-filename");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    fileNameDisplay.textContent = file ? file.name : "No file selected...";
  });

  submitBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    this.classList.add("loading");
    this.innerHTML = `
      <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
      </svg>
      Sending...
    `;
    const formData = new FormData();
    formData.append("name", document.getElementById("fname").value.trim());
    formData.append("contact", document.getElementById("phone").value.trim());
    formData.append("email", document.getElementById("email").value.trim());
    formData.append("position", document.getElementById("position").value.trim());
    formData.append("message", document.getElementById("message").value.trim());
    formData.append("websiteId", "ISC");
    if (fileInput.files.length > 0) {
      formData.append("resume", fileInput.files[0]);
    }

    try {
      const res = await fetch("https://my-mailserver.vercel.app/api/careerMail", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Submission failed");

      alert("✅ " + result.message);
      form.reset();
      fileNameDisplay.textContent = "No file selected...";
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
      submitBtn.classList.remove("loading");
      submitBtn.innerHTML = 'Submit Application';
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.innerHTML = 'Submit Application';
    }
  });
});
