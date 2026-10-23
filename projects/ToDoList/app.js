const STORAGE_KEY = "taskflow-state-v1";
const createId = () => window.crypto?.randomUUID?.() || `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const STATUS_LABELS = {
  "not-started": "Not started",
  "in-progress": "In progress",
  review: "Review",
  completed: "Completed"
};
const STARTER_TASK_TITLES = new Set([
  "Finish mathematics assignment",
  "Prepare weekly presentation",
  "Call dentist for follow-up",
  "Submit monthly expense report"
]);

const defaultState = {
  theme: "light",
  view: "list",
  nav: "inbox",
  search: "",
  statusFilter: "all",
  priorityFilter: "all",
  projectFilter: "all",
  sort: "created",
  tasks: [],
  projects: []
};

let state = loadState();
let activeTaskId = null;
let deletedTask = null;
let undoTimer = null;
let calendarCursor = new Date();

const refs = {
  taskContainer: document.getElementById("task-container"),
  projectList: document.getElementById("project-list"),
  projectFilter: document.getElementById("project-filter"),
  searchInput: document.getElementById("search-input"),
  quickAddInput: document.getElementById("quick-add-input"),
  newTaskBtn: document.getElementById("new-task-btn"),
  addProjectBtn: document.getElementById("add-project-btn"),
  statusFilter: document.getElementById("status-filter"),
  priorityFilter: document.getElementById("priority-filter"),
  themeToggle: document.getElementById("theme-toggle"),
  viewToggle: document.getElementById("view-toggle"),
  modal: document.getElementById("task-modal"),
  taskForm: document.getElementById("task-form"),
  taskId: document.getElementById("task-id"),
  taskTitle: document.getElementById("task-title"),
  taskDescription: document.getElementById("task-description"),
  taskProject: document.getElementById("task-project"),
  taskStatus: document.getElementById("task-status"),
  taskPriority: document.getElementById("task-priority"),
  taskDueDate: document.getElementById("task-due-date"),
  taskDueTime: document.getElementById("task-due-time"),
  taskTags: document.getElementById("task-tags"),
  taskNotes: document.getElementById("task-notes"),
  subtaskList: document.getElementById("subtask-list"),
  attachmentList: document.getElementById("attachment-list"),
  attachmentInput: document.getElementById("attachment-input"),
  addSubtaskBtn: document.getElementById("add-subtask-btn")
};

init();

function init() {
  if (!window.localStorage.getItem(STORAGE_KEY)) {
    saveState(defaultState);
    state = loadState();
  }

  applyTheme(state.theme);
  bindEvents();
  renderAll();
}

function bindEvents() {
  refs.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim();
    renderAll();
  });

  refs.statusFilter.addEventListener("change", (event) => {
    state.statusFilter = event.target.value;
    renderAll();
  });

  refs.priorityFilter.addEventListener("change", (event) => {
    state.priorityFilter = event.target.value;
    renderAll();
  });

  refs.projectFilter.addEventListener("change", (event) => {
    state.projectFilter = event.target.value;
    renderAll();
  });
  document.getElementById("sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderAll(); });

  refs.newTaskBtn.addEventListener("click", () => openTaskModal());
  refs.quickAddInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      quickAddTask();
    }
  });

  document.getElementById("quick-add-btn").addEventListener("click", quickAddTask);
  refs.themeToggle.addEventListener("click", toggleTheme);
  refs.viewToggle.addEventListener("click", toggleView);
  document.getElementById("export-btn").addEventListener("click", exportData);
  document.getElementById("import-input").addEventListener("change", importData);
  document.getElementById("undo-delete").addEventListener("click", undoDelete);
  document.getElementById("calendar-prev").addEventListener("click", () => changeCalendarMonth(-1));
  document.getElementById("calendar-next").addEventListener("click", () => changeCalendarMonth(1));
  document.getElementById("calendar-today").addEventListener("click", () => { calendarCursor = new Date(); renderTasks(); });
  document.addEventListener("keydown", (event) => {
    const typing = event.target.matches("input, textarea, select, [contenteditable='true']");
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); refs.searchInput.focus(); }
    else if (!typing && event.key.toLowerCase() === "n") { event.preventDefault(); openTaskModal(); }
    else if (event.key === "Escape" && !refs.modal.classList.contains("hidden")) closeTaskModal();
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      state.nav = button.dataset.nav;
      if (state.nav !== "calendar" && state.view === "calendar") state.view = "list";
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
      renderAll();
    });
  });

  refs.taskForm.addEventListener("submit", saveTaskFromForm);
  refs.addSubtaskBtn.addEventListener("click", addSubtaskRow);
  refs.attachmentInput.addEventListener("change", handleAttachmentSelection);

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeTaskModal);
  });

  refs.addProjectBtn.addEventListener("click", () => {
    const projectName = window.prompt("Project name:");
    if (!projectName) return;
    const cleaned = projectName.trim();
    if (!cleaned) return;
    if (!state.projects.includes(cleaned)) {
      state.projects.push(cleaned);
      saveState(state);
      renderAll();
    }
  });
}

function renderAll() {
  renderNavState();
  renderSummary();
  renderProjectList();
  renderFilters();
  renderTasks();
  saveState(state);
}

function renderNavState() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.nav === state.nav);
  });

  refs.searchInput.value = state.search;
  refs.statusFilter.value = state.statusFilter;
  refs.priorityFilter.value = state.priorityFilter;
  refs.projectFilter.value = state.projectFilter;
  document.getElementById("sort-select").value = state.sort || "created";

  refs.viewToggle.textContent = state.view === "list" ? "Kanban View" : state.view === "kanban" ? "Calendar View" : "List View";
  refs.themeToggle.textContent = state.theme === "dark" ? "☀️" : "🌙";
}

function renderSummary() {
  const today = formatDateOffset(0);
  const tasks = state.tasks;
  const completed = tasks.filter((task) => task.status === "completed").length;
  const todayCount = tasks.filter((task) => task.dueDate === today && task.status !== "completed").length;
  const overdue = tasks.filter((task) => {
    if (!task.dueDate || task.status === "completed") return false;
    return new Date(task.dueDate + "T23:59:59") < new Date(today + "T00:00:00");
  }).length;
  const upcoming = tasks.filter((task) => {
    if (!task.dueDate || task.status === "completed") return false;
    return new Date(task.dueDate) > new Date(today + "T00:00:00");
  }).length;

  document.getElementById("today-count").textContent = todayCount;
  document.getElementById("completed-count").textContent = completed;
  document.getElementById("overdue-count").textContent = overdue;
  document.getElementById("upcoming-count").textContent = upcoming;
  const hour = new Date().getHours();
  document.getElementById("welcome-heading").textContent = `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"} 👋`;
  document.getElementById("welcome-date").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const todayTasks = tasks.filter((task) => task.dueDate === today);
  const doneToday = todayTasks.filter((task) => task.status === "completed").length;
  document.getElementById("progress-label").textContent = `${doneToday} / ${todayTasks.length} complete`;
  document.getElementById("progress-bar").style.width = `${todayTasks.length ? Math.round(doneToday / todayTasks.length * 100) : 0}%`;
}

function renderProjectList() {
  refs.projectList.innerHTML = "";
  state.projects.forEach((project) => {
    const pill = document.createElement("button");
    pill.type = "button";
    pill.className = "project-pill";
    pill.innerHTML = `<span class="project-dot" style="background:${pickProjectColor(project)}"></span><span>${escapeHtml(project)}</span>`;
    pill.addEventListener("click", () => {
      state.projectFilter = project;
      refs.projectFilter.value = project;
      renderAll();
    });
    refs.projectList.appendChild(pill);
  });
}

function renderFilters() {
  refs.projectFilter.innerHTML = '<option value="all">All projects</option>';
  state.projects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    refs.projectFilter.appendChild(option);
  });
  refs.projectFilter.value = state.projectFilter;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();

  const calendarMode = state.nav === "calendar" || state.view === "calendar";
  document.getElementById("calendar-toolbar").classList.toggle("hidden", !calendarMode);
  if (calendarMode) {
    refs.taskContainer.innerHTML = renderCalendar(visibleTasks);
    document.getElementById("calendar-month").textContent = calendarCursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    refs.taskContainer.querySelectorAll("[data-calendar-task]").forEach((item) => item.addEventListener("click", () => openTaskModal(item.dataset.calendarTask)));
    refs.taskContainer.querySelectorAll("[data-calendar-date]").forEach((item) => item.addEventListener("click", () => { openTaskModal(); refs.taskDueDate.value = item.dataset.calendarDate; }));
    return;
  }

  if (state.view === "kanban") {
    refs.taskContainer.innerHTML = renderKanbanBoard(visibleTasks);
    attachKanbanEvents();
    return;
  }

  refs.taskContainer.innerHTML = "";
  const list = document.createElement("div");
  list.className = "task-list";

  if (!visibleTasks.length) {
    list.innerHTML = '<div class="empty-state">No tasks match your current filters.</div>';
    refs.taskContainer.appendChild(list);
    return;
  }

  visibleTasks.forEach((task) => {
    list.appendChild(createTaskCard(task));
  });

  refs.taskContainer.appendChild(list);
}

function getVisibleTasks() {
  const query = state.search.toLowerCase();
  const visible = state.tasks.filter((task) => {
    const searchMatch = !query || [task.title, task.description, task.project, task.notes, (task.tags || []).join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query);

    const navMatch = (() => {
      switch (state.nav) {
        case "today":
          return task.dueDate === formatDateOffset(0) && task.status !== "completed";
        case "upcoming":
          return task.dueDate && new Date(task.dueDate) >= new Date(formatDateOffset(0) + "T00:00:00") && task.status !== "completed";
        case "calendar":
          return !!task.dueDate;
        case "all":
          return true;
        case "completed":
          return task.status === "completed";
        case "overdue":
          return Boolean(task.dueDate) && task.status !== "completed" && new Date(task.dueDate + "T23:59:59") < new Date();
        default:
          return true;
      }
    })();

    const statusMatch = state.statusFilter === "all" || task.status === state.statusFilter;
    const priorityMatch = state.priorityFilter === "all" || task.priority === state.priorityFilter;
    const projectMatch = state.projectFilter === "all" || task.project === state.projectFilter;

    return searchMatch && navMatch && statusMatch && priorityMatch && projectMatch;
  });
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3, none: 4 };
  return visible.sort((a, b) => {
    if (state.sort === "due") return (a.dueDate || "9999-12-31").localeCompare(b.dueDate || "9999-12-31");
    if (state.sort === "priority") return (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (state.sort === "title") return a.title.localeCompare(b.title);
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = `task-card ${task.status === "completed" ? "completed" : ""}`;
  card.draggable = true;
  card.dataset.taskId = task.id;

  const completionButton = document.createElement("button");
  completionButton.type = "button";
  completionButton.className = `task-checkbox ${task.status === "completed" ? "completed" : ""}`;
  completionButton.title = task.status === "completed" ? "Mark as incomplete" : "Complete task";
  completionButton.addEventListener("click", () => toggleTaskComplete(task.id));

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = task.title;
  title.addEventListener("click", () => openTaskModal(task.id));

  const cardMeta = document.createElement("div");
  cardMeta.className = "task-meta";

  const statusPill = document.createElement("span");
  statusPill.className = `status-pill ${task.status}`;
  statusPill.textContent = STATUS_LABELS[task.status] || "Not started";

  const priorityBadge = document.createElement("span");
  priorityBadge.className = `priority-badge ${task.priority || "none"}`;
  priorityBadge.textContent = task.priority ? capitalize(task.priority) : "None";

  if (task.project) {
    const projectBadge = document.createElement("span");
    projectBadge.className = "project-badge";
    projectBadge.textContent = task.project;
    cardMeta.appendChild(projectBadge);
  }

  if (task.dueDate) {
    const due = document.createElement("span");
    due.textContent = formatDueDate(task.dueDate, task.dueTime);
    cardMeta.appendChild(due);
  }

  cardMeta.prepend(priorityBadge);
  cardMeta.prepend(statusPill);

  const tagWrap = document.createElement("div");
  tagWrap.className = "task-meta";
  task.tags.forEach((tag) => {
    const tagBadge = document.createElement("span");
    tagBadge.className = "tag-badge";
    tagBadge.textContent = tag.startsWith("#") ? tag : `#${tag}`;
    tagWrap.appendChild(tagBadge);
  });

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "task-delete-btn";
  deleteBtn.textContent = "Delete";
  deleteBtn.addEventListener("click", () => deleteTask(task.id));
  actions.appendChild(deleteBtn);

  const content = document.createElement("div");
  content.className = "task-body" + (task.description || task.subtasks.length ? "" : " hidden");
  if (task.description) {
    const desc = document.createElement("div");
    desc.textContent = task.description;
    content.appendChild(desc);
  }

  if (task.subtasks.length) {
    const subtaskWrap = document.createElement("div");
    subtaskWrap.className = "task-subtasks";
    task.subtasks.slice(0, 3).forEach((subtask) => {
      const row = document.createElement("div");
      row.className = `subtask-item ${subtask.done ? "done" : ""}`;
      row.innerHTML = `<span>${subtask.done ? "✓" : "○"}</span><span>${escapeHtml(subtask.text)}</span>`;
      subtaskWrap.appendChild(row);
    });
    content.appendChild(subtaskWrap);
  }

  const main = document.createElement("div");
  main.className = "task-main";
  main.appendChild(completionButton);

  const taskTitleWrap = document.createElement("div");
  taskTitleWrap.className = "task-title-wrap";
  taskTitleWrap.appendChild(title);
  taskTitleWrap.appendChild(cardMeta);
  if (tagWrap.childElementCount) {
    taskTitleWrap.appendChild(tagWrap);
  }
  main.appendChild(taskTitleWrap);

  const header = document.createElement("div");
  header.className = "task-card-header";
  header.appendChild(main);
  header.appendChild(actions);

  card.appendChild(header);
  if (content.childElementCount) {
    card.appendChild(content);
  }

  card.addEventListener("dragstart", () => {
    card.classList.add("dragging");
    card.setAttribute("data-dragging", task.id);
  });

  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
    card.removeAttribute("data-dragging");
  });

  return card;
}

function renderKanbanBoard(tasks) {
  const columns = [
    { key: "not-started", label: "Not started" },
    { key: "in-progress", label: "In progress" },
    { key: "review", label: "Review" },
    { key: "completed", label: "Completed" }
  ];

  const board = document.createElement("div");
  board.className = "task-board";

  columns.forEach((column) => {
    const tasksInColumn = tasks.filter((task) => task.status === column.key);
    const columnEl = document.createElement("div");
    columnEl.className = "board-column";
    columnEl.dataset.status = column.key;
    columnEl.innerHTML = `
      <div class="board-column-header">
        <span>${column.label}</span>
        <span class="tag-badge">${tasksInColumn.length}</span>
      </div>
      <div class="board-column-body">
        ${tasksInColumn.length ? tasksInColumn.map((task) => `
          <article class="task-card" data-task-id="${task.id}" draggable="true">
            <div class="task-card-header">
              <div class="task-main">
                <button type="button" class="task-checkbox ${task.status === "completed" ? "completed" : ""}" data-toggle-task="${task.id}"></button>
                <div class="task-title-wrap">
                  <h3 class="task-title" data-open-task="${task.id}">${escapeHtml(task.title)}</h3>
                  <div class="task-meta">
                    <span class="priority-badge ${task.priority || "none"}">${capitalize(task.priority || "none")}</span>
                    ${task.project ? `<span class="project-badge">${escapeHtml(task.project)}</span>` : ""}
                    ${task.dueDate ? `<span>${escapeHtml(formatDueDate(task.dueDate, task.dueTime))}</span>` : ""}
                  </div>
                </div>
              </div>
            </div>
          </article>
        `).join("") : '<div class="empty-state">No tasks here.</div>'}
      </div>
    `;
    board.appendChild(columnEl);
  });

  return board.outerHTML;
}

function changeCalendarMonth(delta) { calendarCursor = new Date(calendarCursor.getFullYear(), calendarCursor.getMonth() + delta, 1); renderTasks(); }

function renderCalendar(tasks) {
  const year = calendarCursor.getFullYear(), month = calendarCursor.getMonth();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7, days = new Date(year, month + 1, 0).getDate();
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
  let body = "";
  for (let index = 0; index < 42; index++) {
    const dayNumber = index - offset + 1;
    if (dayNumber < 1 || dayNumber > days) { body += '<div class="calendar-day outside"></div>'; continue; }
    const date = `${year}-${String(month + 1).padStart(2,"0")}-${String(dayNumber).padStart(2,"0")}`;
    const dayTasks = tasks.filter((task) => task.dueDate === date);
    body += `<div class="calendar-day${date === formatDateOffset(0) ? " today" : ""}"><button class="calendar-date" type="button" data-calendar-date="${date}">${dayNumber}<span>+</span></button><div class="calendar-events">${dayTasks.slice(0, 4).map((task) => `<button class="calendar-event ${escapeHtml(task.priority || "none")}" type="button" data-calendar-task="${escapeHtml(task.id)}">${escapeHtml(task.title)}</button>`).join("")}${dayTasks.length > 4 ? `<small>+${dayTasks.length - 4} more</small>` : ""}</div></div>`;
  }
  return `<div class="calendar-grid">${weekdays}${body}</div>`;
}

function attachKanbanEvents() {
  document.querySelectorAll("[data-open-task]").forEach((button) => {
    button.addEventListener("click", () => openTaskModal(button.dataset.openTask));
  });

  document.querySelectorAll("[data-toggle-task]").forEach((button) => {
    button.addEventListener("click", () => toggleTaskComplete(button.dataset.toggleTask));
  });

  document.querySelectorAll(".board-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });

    column.addEventListener("dragleave", () => {
      column.classList.remove("drag-over");
    });

    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      const taskId = document.querySelector("[data-dragging]")?.dataset?.dragging;
      if (!taskId) return;
      moveTaskToStatus(taskId, column.dataset.status);
    });
  });

  document.querySelectorAll(".task-card[draggable='true']").forEach((card) => {
    card.addEventListener("dragstart", () => {
      card.classList.add("dragging");
      card.setAttribute("data-dragging", card.dataset.taskId);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      card.removeAttribute("data-dragging");
    });
  });
}

function openTaskModal(taskId = null) {
  activeTaskId = taskId;
  refs.taskForm.reset();
  refs.subtaskList.innerHTML = "";
  refs.attachmentList.innerHTML = "";

  if (!taskId) {
    refs.taskId.value = "";
    refs.taskTitle.value = "";
    refs.taskDescription.value = "";
    refs.taskProject.value = "";
    refs.taskStatus.value = "not-started";
    refs.taskPriority.value = "none";
    refs.taskDueDate.value = "";
    refs.taskDueTime.value = "";
    refs.taskTags.value = "";
    refs.taskNotes.value = "";
    refs.attachmentInput.value = "";
    refs.modal.classList.remove("hidden");
    refs.modal.setAttribute("aria-hidden", "false");
    return;
  }

  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  refs.taskId.value = task.id;
  refs.taskTitle.value = task.title;
  refs.taskDescription.value = task.description || "";
  refs.taskProject.value = task.project || "";
  refs.taskStatus.value = task.status;
  refs.taskPriority.value = task.priority || "none";
  refs.taskDueDate.value = task.dueDate || "";
  refs.taskDueTime.value = task.dueTime || "";
  refs.taskTags.value = task.tags.join(" ");
  refs.taskNotes.value = task.notes || "";

  task.subtasks.forEach((subtask) => addSubtaskRow(subtask));
  renderAttachments(task.attachments);

  refs.modal.classList.remove("hidden");
  refs.modal.setAttribute("aria-hidden", "false");
}

function closeTaskModal() {
  refs.modal.classList.add("hidden");
  refs.modal.setAttribute("aria-hidden", "true");
  activeTaskId = null;
}

function addSubtaskRow(subtask = { text: "", done: false }) {
  const row = document.createElement("div");
  row.className = "subtask-row";
  row.innerHTML = `
    <input type="checkbox" ${subtask.done ? "checked" : ""} aria-label="Mark subtask complete" />
    <input type="text" value="${escapeHtml(subtask.text)}" placeholder="Add subtask" />
    <button type="button">Remove</button>
  `;

  row.querySelector("button").addEventListener("click", () => row.remove());
  refs.subtaskList.appendChild(row);
}

function handleAttachmentSelection(event) {
  const files = Array.from(event.target.files || []);

  if (!activeTaskId) {
    window.alert("Save the task before attaching files.");
    event.target.value = "";
    return;
  }

  const task = state.tasks.find((item) => item.id === activeTaskId);
  if (!task) {
    event.target.value = "";
    return;
  }

  files.forEach((file) => {
    if (file.size > 2 * 1024 * 1024) { window.alert(`${file.name} is larger than 2 MB. Choose a smaller file.`); return; }
    if (!(file.type.startsWith("image/") || file.type.startsWith("text/") || ["application/pdf", "application/json", "application/zip"].includes(file.type))) { window.alert(`${file.name} has an unsupported file type.`); return; }
    const attachment = {
      id: createId(),
      name: file.name,
      size: file.size,
      type: file.type,
      preview: "",
      data: "",
      createdAt: new Date().toISOString()
    };

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      attachment.data = loadEvent.target.result;
      if (file.type.startsWith("image/")) attachment.preview = attachment.data;
      task.attachments.push(attachment); renderAttachments(task.attachments); saveState(state);
    };
    reader.onerror = () => window.alert(`Could not read ${file.name}. Try again.`);
    reader.readAsDataURL(file);
  });

  event.target.value = "";
}

function renderAttachments(attachments) {
  refs.attachmentList.innerHTML = "";
  if (!attachments.length) {
    refs.attachmentList.innerHTML = '<div class="empty-text">No attachments yet.</div>';
    return;
  }

  attachments.forEach((attachment) => {
    const item = document.createElement("div");
    item.className = "attachment-item";

    const info = document.createElement("div");
    info.className = "attachment-info";

    if (typeof attachment.preview === "string" && attachment.preview.startsWith("data:image/")) {
      const preview = document.createElement("img");
      preview.className = "attachment-preview";
      preview.src = attachment.preview;
      preview.alt = attachment.name;
      info.appendChild(preview);
    }

    const text = document.createElement("div");
    text.innerHTML = `<strong>${escapeHtml(attachment.name)}</strong><br><small>${formatBytes(attachment.size)}</small>`;
    info.appendChild(text);
    if (typeof attachment.data === "string" && attachment.data.startsWith("data:")) {
      const download = document.createElement("a"); download.href = attachment.data; download.download = attachment.name; download.className = "attachment-download"; download.textContent = "Download"; info.appendChild(download);
    }

    const actions = document.createElement("div");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      const task = state.tasks.find((entry) => entry.id === activeTaskId);
      if (!task) return;
      task.attachments = task.attachments.filter((entry) => entry.id !== attachment.id);
      renderAttachments(task.attachments);
    });

    actions.appendChild(remove);
    item.appendChild(info);
    item.appendChild(actions);
    refs.attachmentList.appendChild(item);
  });
}

function saveTaskFromForm(event) {
  event.preventDefault();

  const taskFields = {
    title: refs.taskTitle.value.trim(),
    description: refs.taskDescription.value.trim(),
    project: refs.taskProject.value.trim(),
    status: refs.taskStatus.value,
    priority: refs.taskPriority.value,
    dueDate: refs.taskDueDate.value,
    dueTime: refs.taskDueTime.value,
    tags: parseTags(refs.taskTags.value),
    notes: refs.taskNotes.value.trim(),
    subtasks: collectSubtasks(),
    attachments: []
  };

  if (!taskFields.title) {
    window.alert("Task title is required.");
    return;
  }

  const existingTask = state.tasks.find((task) => task.id === refs.taskId.value);

  if (existingTask) {
    Object.assign(existingTask, taskFields, {
      attachments: existingTask.attachments || [],
      updatedAt: new Date().toISOString(),
      completedAt: taskFields.status === "completed" ? existingTask.completedAt || new Date().toISOString() : null
    });
  } else {
    const newTask = {
      id: createId(),
      ...taskFields,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: taskFields.status === "completed" ? new Date().toISOString() : null
    };
    state.tasks.unshift(newTask);
    if (taskFields.project && !state.projects.includes(taskFields.project)) {
      state.projects.push(taskFields.project);
    }
    resetTaskListFilters();
  }

  closeTaskModal();
  renderAll();
}

function collectSubtasks() {
  return Array.from(refs.subtaskList.querySelectorAll(".subtask-row")).map((row) => ({
    id: createId(),
    text: row.querySelector("input[type='text']").value.trim(),
    done: row.querySelector("input[type='checkbox']").checked
  })).filter((subtask) => subtask.text);
}

function toggleTaskComplete(taskId) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  task.status = task.status === "completed" ? "in-progress" : "completed";
  task.completedAt = task.status === "completed" ? new Date().toISOString() : null;
  task.updatedAt = new Date().toISOString();
  renderAll();
}

function deleteTask(taskId) {
  const index = state.tasks.findIndex((task) => task.id === taskId);
  if (index < 0) return;
  deletedTask = { task: state.tasks[index], index };
  state.tasks.splice(index, 1);
  const toast = document.getElementById("undo-toast"); toast.classList.add("show");
  clearTimeout(undoTimer); undoTimer = setTimeout(() => { toast.classList.remove("show"); deletedTask = null; }, 6000);
  renderAll();
}

function undoDelete() {
  if (!deletedTask) return;
  state.tasks.splice(deletedTask.index, 0, deletedTask.task); deletedTask = null;
  clearTimeout(undoTimer); document.getElementById("undo-toast").classList.remove("show"); renderAll();
}

function moveTaskToStatus(taskId, newStatus) {
  const task = state.tasks.find((entry) => entry.id === taskId);
  if (!task) return;
  task.status = newStatus;
  task.updatedAt = new Date().toISOString();
  task.completedAt = newStatus === "completed" ? new Date().toISOString() : null;
  renderAll();
}

function quickAddTask() {
  const input = refs.quickAddInput.value.trim();
  if (!input) return;

  const parsed = parseQuickAdd(input);
  const title = parsed.title || input;

  const newTask = {
    id: createId(),
    title,
    description: "",
    status: "not-started",
    priority: parsed.priority || "none",
    project: parsed.project || "",
    dueDate: parsed.dueDate || "",
    dueTime: parsed.dueTime || "",
    tags: parsed.tags,
    notes: "",
    subtasks: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };

  state.tasks.unshift(newTask);
  if (parsed.project && !state.projects.includes(parsed.project)) {
    state.projects.push(parsed.project);
  }

  refs.quickAddInput.value = "";
  renderAll();
}

function parseQuickAdd(text) {
  const result = {
    title: text,
    priority: "none",
    project: "",
    dueDate: "",
    dueTime: "",
    tags: []
  };

  const matchPriority = text.match(/\!(low|medium|high|urgent)/i);
  if (matchPriority) {
    result.priority = matchPriority[1].toLowerCase();
    result.title = result.title.replace(matchPriority[0], "").trim();
  }

  const tagMatches = [...text.matchAll(/#([\w-]+)/g)];
  result.tags = tagMatches.map((match) => `#${match[1]}`);
  result.title = result.title.replace(/#([\w-]+)/g, "").trim();

  const projectMatches = text.match(/\b(project|for)\s+([A-Za-z0-9\s-]+)/i);
  if (projectMatches) {
    result.project = projectMatches[2].trim();
    result.title = result.title.replace(projectMatches[0], "").trim();
  }

  const dueMatcher = text.match(/\b(tomorrow|today|next monday|this friday|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  if (dueMatcher) {
    result.dueDate = resolveNaturalDate(dueMatcher[0]);
    result.title = result.title.replace(dueMatcher[0], "").trim();
  }

  if (text.match(/\d{1,2}:\d{2}/)) {
    const timeMatch = text.match(/(\d{1,2}:\d{2})/);
    result.dueTime = timeMatch[1];
    result.title = result.title.replace(timeMatch[1], "").trim();
  }

  result.title = result.title.replace(/\s+/g, " ").trim();
  return result;
}

function resolveNaturalDate(token) {
  const normalized = token.toLowerCase();
  const base = new Date();
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());

  if (normalized === "today") return formatDateValue(today);
  if (normalized === "tomorrow") return formatDateValue(addDays(today, 1));

  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const index = weekdays.indexOf(normalized);
  if (index > -1) {
    const delta = (index - today.getDay() + 7) % 7;
    return formatDateValue(addDays(today, delta || 7));
  }

  return formatDateValue(today);
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  applyTheme(state.theme);
  renderAll();
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  state.theme = theme;
}

function toggleView() {
  if (state.nav === "calendar") {
    state.nav = "all";
    state.view = "kanban";
  } else {
    state.view = state.view === "list" ? "kanban" : state.view === "kanban" ? "calendar" : "list";
    if (state.view === "calendar") state.nav = "calendar";
  }
  renderAll();
}

function exportData() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks: state.tasks, projects: state.projects }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = `taskflow-backup-${formatDateOffset(0)}.json`; link.click(); URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.tasks) || !imported.tasks.every((task) => task && typeof task.title === "string")) throw new Error("Invalid backup");
      if (!window.confirm(`Import ${imported.tasks.length} tasks? This replaces the tasks currently stored in this browser.`)) return;
      state.tasks = imported.tasks.map(normalizeTask);
      state.projects = Array.isArray(imported.projects) ? imported.projects.filter((project) => typeof project === "string") : [];
      resetTaskListFilters(); renderAll();
    } catch { window.alert("This file is not a valid TaskFlow backup."); }
    finally { event.target.value = ""; }
  };
  reader.readAsText(file);
}

function saveState(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.error("TaskFlow could not save local data", error);
    window.alert("Unable to save your changes in this browser. Export your data and free up browser storage before continuing.");
  }
}

function loadState() {
  try {
    const raw = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw) return structuredClone(defaultState);
    const tasks = Array.isArray(raw.tasks) ? raw.tasks.map(normalizeTask) : structuredClone(defaultState.tasks);
    const remainingTasks = tasks.filter((task) => !STARTER_TASK_TITLES.has(task.title));
    const projects = Array.isArray(raw.projects) ? raw.projects.filter((project) => typeof project === "string") : structuredClone(defaultState.projects);
    const removedStarterTasks = remainingTasks.length !== tasks.length;
    const remainingProjects = removedStarterTasks
      ? projects.filter((project) => !["College", "Work", "Personal", "Finance"].includes(project)
        || remainingTasks.some((task) => task.project === project))
      : projects;
    return {
      ...structuredClone(defaultState),
      ...raw,
      tasks: remainingTasks,
      projects: remainingProjects,
      sort: ["created", "due", "priority", "title"].includes(raw.sort) ? raw.sort : "created"
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function normalizeTask(task) {
  const statuses = ["not-started", "in-progress", "review", "completed"];
  const priorities = ["none", "low", "medium", "high", "urgent"];
  return {
    ...task,
    id: typeof task.id === "string" ? task.id : createId(),
    title: task.title.trim(),
    description: typeof task.description === "string" ? task.description : "",
    status: statuses.includes(task.status) ? task.status : "not-started",
    priority: priorities.includes(task.priority) ? task.priority : "none",
    project: typeof task.project === "string" ? task.project : "",
    dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
    dueTime: typeof task.dueTime === "string" ? task.dueTime : "",
    tags: Array.isArray(task.tags) ? task.tags.filter((tag) => typeof tag === "string") : [],
    notes: typeof task.notes === "string" ? task.notes : "",
    subtasks: Array.isArray(task.subtasks) ? task.subtasks.filter((item) => item && typeof item.text === "string").map((item) => ({ id: item.id || createId(), text: item.text, done: Boolean(item.done) })) : [],
    attachments: Array.isArray(task.attachments) ? task.attachments.filter((item) => item && typeof item.name === "string") : [],
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString(),
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : new Date().toISOString(),
    completedAt: typeof task.completedAt === "string" ? task.completedAt : null
  };
}

function pickProjectColor(project) {
  const palette = ["#6f6af8", "#2bb673", "#ff9d2e", "#f05d5d", "#4aa3ff", "#8c6bff"];
  const hash = [...project].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function formatDateOffset(offset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return formatDateValue(date);
}

function formatDateValue(date) {
  const normalized = new Date(date);
  const year = normalized.getFullYear();
  const month = `${normalized.getMonth() + 1}`.padStart(2, "0");
  const day = `${normalized.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDueDate(date, time) {
  if (!date) return "No due date";
  const dateValue = new Date(`${date}T12:00:00`);
  const formatted = dateValue.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return time ? `${formatted} ${time}` : formatted;
}

function parseTags(value) {
  return [...new Set((value.match(/#?[A-Za-z0-9_-]+/g) || []).map((tag) => tag.startsWith("#") ? tag : `#${tag}`))];
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function capitalize(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
