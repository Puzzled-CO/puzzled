const MAX_MEMBERS = 4;
const MAX_TEAMS_PER_EVENT = 5;
const UPCOMING_SUNDAYS = 8;
const ENTRY_PRICE_PER_PERSON = 20;

// Replace this with your live Stripe, Square, PayPal, or checkout link.
const PAYMENT_LINK = "";

const form = document.querySelector("#signupForm");
const membersList = document.querySelector("#membersList");
const addMemberButton = document.querySelector("#addMember");
const removeMemberButton = document.querySelector("#removeMember");
const memberCount = document.querySelector("#memberCount");
const formMessage = document.querySelector("#formMessage");
const eventCalendar = document.querySelector("#eventCalendar");
const eventDateInput = document.querySelector("#eventDate");
const selectedEventLabel = document.querySelector("#selectedEventLabel");
const selectedEventCapacity = document.querySelector("#selectedEventCapacity");
const checkoutTotal = document.querySelector("#checkoutTotal");
const submitButton = document.querySelector("#submitButton");

let selectedEventDate = "";

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatEventLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  }).format(date);
}

function getUpcomingSundays(count) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilSunday = (7 - today.getDay()) % 7;
  const firstSunday = new Date(today);
  firstSunday.setDate(today.getDate() + daysUntilSunday);

  return Array.from({ length: count }, (_, index) => {
    const sunday = new Date(firstSunday);
    sunday.setDate(firstSunday.getDate() + index * 7);
    return sunday;
  });
}

function getEventCounts() {
  return JSON.parse(localStorage.getItem("puzzledEventCounts") || "{}");
}

function saveEventCounts(counts) {
  localStorage.setItem("puzzledEventCounts", JSON.stringify(counts));
}

function getRemainingTeams(dateKey) {
  const counts = getEventCounts();
  const registeredTeams = counts[dateKey] || 0;
  return Math.max(0, MAX_TEAMS_PER_EVENT - registeredTeams);
}

function updateSelectedEvent(dateKey) {
  selectedEventDate = dateKey;
  eventDateInput.value = dateKey;
  selectedEventLabel.textContent = formatEventLabel(dateKey);
  selectedEventCapacity.textContent = `${getRemainingTeams(dateKey)} of ${MAX_TEAMS_PER_EVENT} spots left`;

  eventCalendar.querySelectorAll(".event-card").forEach((card) => {
    card.setAttribute("aria-pressed", String(card.dataset.date === dateKey));
  });
}

function renderCalendar() {
  const sundays = getUpcomingSundays(UPCOMING_SUNDAYS);
  eventCalendar.innerHTML = "";

  sundays.forEach((date) => {
    const dateKey = formatDateKey(date);
    const remaining = getRemainingTeams(dateKey);
    const isSoldOut = remaining === 0;
    const card = document.createElement("button");
    card.className = "event-card";
    card.type = "button";
    card.dataset.date = dateKey;
    card.disabled = isSoldOut;
    card.setAttribute("aria-pressed", "false");
    card.innerHTML = `
      <span class="event-date">
        <span class="event-month">${new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)}</span>
        <span class="event-day">${date.getDate()}</span>
      </span>
      <span class="event-meta">
        <span>Sunday</span>
        <span class="event-status">${isSoldOut ? "Sold out" : `${remaining} spots left`}</span>
      </span>
    `;
    card.addEventListener("click", () => updateSelectedEvent(dateKey));
    eventCalendar.append(card);
  });

  const firstAvailable = sundays.map(formatDateKey).find((dateKey) => getRemainingTeams(dateKey) > 0);
  if (firstAvailable) {
    updateSelectedEvent(firstAvailable);
  }
}

function getMemberRows() {
  return [...membersList.querySelectorAll("[data-member-row]")];
}

function updateMemberControls() {
  const count = getMemberRows().length;
  const total = count * ENTRY_PRICE_PER_PERSON;
  memberCount.textContent = `${count} of ${MAX_MEMBERS}`;
  addMemberButton.disabled = count >= MAX_MEMBERS;
  removeMemberButton.disabled = count <= 1;
  checkoutTotal.textContent = `$${total}.00`;
  submitButton.textContent = `Register and pay $${total}`;
}

function addMember() {
  const rows = getMemberRows();
  if (rows.length >= MAX_MEMBERS) {
    formMessage.textContent = "Teams are limited to four players.";
    formMessage.className = "form-message warning";
    return;
  }

  const nextNumber = rows.length + 1;
  const row = document.createElement("div");
  row.className = "member-row";
  row.dataset.memberRow = "";
  row.innerHTML = `
    <label for="member-${nextNumber}">Player ${nextNumber}</label>
    <input id="member-${nextNumber}" name="members[]" type="text" autocomplete="name" required>
  `;
  membersList.append(row);
  row.querySelector("input").focus();
  formMessage.textContent = "";
  formMessage.className = "form-message";
  updateMemberControls();
}

function removeMember() {
  const rows = getMemberRows();
  if (rows.length <= 1) {
    return;
  }

  rows.at(-1).remove();
  formMessage.textContent = "";
  formMessage.className = "form-message";
  updateMemberControls();
}

function collectRegistration() {
  const data = new FormData(form);
  return {
    teamName: data.get("teamName"),
    captainName: data.get("captainName"),
    captainEmail: data.get("captainEmail"),
    eventDate: data.get("eventDate"),
    members: data.getAll("members[]").filter(Boolean),
    notes: data.get("notes"),
    entryPricePerPerson: ENTRY_PRICE_PER_PERSON,
    totalDue: data.getAll("members[]").filter(Boolean).length * ENTRY_PRICE_PER_PERSON,
    drinkTickets: data.getAll("members[]").filter(Boolean).length,
    registeredAt: new Date().toISOString()
  };
}

async function submitFormForHosting() {
  const data = new FormData(form);
  const encoded = new URLSearchParams(data);

  try {
    await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encoded.toString()
    });
  } catch {
    // Local file/server previews often cannot accept form posts.
  }
}

async function submitRegistration(event) {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const registration = collectRegistration();

  if (!registration.eventDate || getRemainingTeams(registration.eventDate) <= 0) {
    formMessage.textContent = "Please choose an available Sunday event.";
    formMessage.className = "form-message warning";
    return;
  }

  if (registration.members.length > MAX_MEMBERS) {
    formMessage.textContent = "Teams are limited to four players.";
    formMessage.className = "form-message warning";
    return;
  }

  localStorage.setItem("speedPuzzleRegistration", JSON.stringify(registration));
  const counts = getEventCounts();
  counts[registration.eventDate] = (counts[registration.eventDate] || 0) + 1;
  saveEventCounts(counts);
  renderCalendar();
  updateSelectedEvent(registration.eventDate);
  await submitFormForHosting();

  if (PAYMENT_LINK) {
    formMessage.textContent = "Registration saved. Sending you to payment...";
    formMessage.className = "form-message success";
    window.location.href = PAYMENT_LINK;
    return;
  }

  formMessage.textContent = `Registration saved. Add your real checkout link in script.js to accept the $${registration.totalDue} payment online.`;
  formMessage.className = "form-message success";
}

addMemberButton.addEventListener("click", addMember);
removeMemberButton.addEventListener("click", removeMember);
form.addEventListener("submit", submitRegistration);
renderCalendar();
updateMemberControls();
