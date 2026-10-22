// App state, rendering, and event wiring.
(() => {
  let events = Storage.loadEvents();

  const eventListEl = document.getElementById("event-list");
  const emptyStateEl = document.getElementById("empty-state");
  const addEventForm = document.getElementById("add-event-form");
  const addEventError = document.getElementById("add-event-error");
  const resetBtn = document.getElementById("reset-btn");
  const eventCardTemplate = document.getElementById("event-card-template");
  const taskRowTemplate = document.getElementById("task-row-template");

  function makeId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function persist() {
    Storage.saveEvents(events);
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function clearError(el) {
    el.textContent = "";
    el.hidden = true;
  }

  // --- Rendering ---------------------------------------------------------

  function renderTotals() {
    const totals = Calculations.semesterTotals(events);
    document.getElementById("totals-sga").textContent = Calculations.formatCurrency(totals.sga);
    document.getElementById("totals-obi").textContent = Calculations.formatCurrency(totals.obi);
    document.getElementById("totals-combined").textContent = Calculations.formatCurrency(totals.combined);
  }

  function renderTaskRow(event, task) {
    const node = taskRowTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.taskId = task.id;
    const checkbox = node.querySelector(".task-done-checkbox");
    checkbox.checked = task.done;
    node.querySelector(".task-name").textContent = task.name;
    node.classList.toggle("task-done", task.done);

    const metaParts = [];
    if (task.owner) metaParts.push(task.owner);
    if (task.deadline) metaParts.push(task.deadline);
    node.querySelector(".task-meta").textContent = metaParts.join(" · ");

    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      persist();
      renderAll();
    });

    node.querySelector(".delete-task-btn").addEventListener("click", () => {
      event.tasks = event.tasks.filter((t) => t.id !== task.id);
      persist();
      renderAll();
    });

    return node;
  }

  function renderEventCard(event) {
    const node = eventCardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.eventId = event.id;

    node.querySelector(".event-name").textContent = event.name;
    const statusBadge = node.querySelector(".event-status-badge");
    statusBadge.textContent = event.status;
    statusBadge.classList.add(`status-${event.status.toLowerCase()}`);

    const progress = Calculations.taskProgress(event.tasks);
    node.querySelector(".progress-bar-fill").style.width = `${progress.percent}%`;
    node.querySelector(".progress-fraction").textContent = `${progress.completed}/${progress.total} tasks done`;

    const spend = Calculations.eventSpend(event);
    node.querySelector(".spend-sga").textContent = Calculations.formatCurrency(spend.sga);
    node.querySelector(".spend-obi").textContent = Calculations.formatCurrency(spend.obi);
    node.querySelector(".spend-event-total").textContent = Calculations.formatCurrency(spend.total);

    const toggleBtn = node.querySelector(".toggle-btn");
    const detailPanel = node.querySelector(".event-detail");
    detailPanel.hidden = !event.expanded;
    toggleBtn.textContent = event.expanded ? "Collapse" : "Expand";
    toggleBtn.addEventListener("click", () => {
      event.expanded = !event.expanded;
      persist();
      renderAll();
    });

    // Task list
    const taskListEl = node.querySelector(".task-list");
    event.tasks.forEach((task) => {
      taskListEl.appendChild(renderTaskRow(event, task));
    });

    // Add-task form
    const addTaskForm = node.querySelector(".add-task-form");
    const taskErrorEl = node.querySelector(".task-error");
    addTaskForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nameInput = addTaskForm.querySelector(".task-name-input");
      const ownerInput = addTaskForm.querySelector(".task-owner-input");
      const deadlineInput = addTaskForm.querySelector(".task-deadline-input");
      const name = nameInput.value.trim();

      if (!Storage.isNonEmptyString(name)) {
        showError(taskErrorEl, "Task name is required.");
        return;
      }
      clearError(taskErrorEl);

      event.tasks.push({
        id: makeId(),
        name,
        owner: ownerInput.value.trim(),
        deadline: deadlineInput.value,
        done: false,
      });
      persist();
      renderAll();
    });

    // Add-budget form
    const addBudgetForm = node.querySelector(".add-budget-form");
    const budgetErrorEl = node.querySelector(".budget-error");
    addBudgetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amountInput = addBudgetForm.querySelector(".budget-amount-input");
      const sourceInput = addBudgetForm.querySelector(".budget-source-input");
      const amount = Number(amountInput.value);
      const source = sourceInput.value;

      if (!Number.isFinite(amount) || amount < 0) {
        showError(budgetErrorEl, "Amount must be a non-negative number.");
        return;
      }
      if (!Storage.isValidSource(source)) {
        showError(budgetErrorEl, "Please choose a valid budget source.");
        return;
      }
      clearError(budgetErrorEl);

      event.budget[source] += amount;
      persist();
      renderAll();
    });

    return node;
  }

  function renderAll() {
    eventListEl.innerHTML = "";

    if (events.length === 0) {
      emptyStateEl.hidden = false;
    } else {
      emptyStateEl.hidden = true;
      events.forEach((event) => {
        eventListEl.appendChild(renderEventCard(event));
      });
    }

    renderTotals();
  }

  // --- Top-level actions ---------------------------------------------------

  addEventForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("event-name");
    const statusInput = document.getElementById("event-status");
    const name = nameInput.value.trim();
    const status = statusInput.value;

    if (!Storage.isNonEmptyString(name)) {
      showError(addEventError, "Event name is required.");
      return;
    }
    if (!Storage.isValidStatus(status)) {
      showError(addEventError, "Please choose a valid status.");
      return;
    }
    clearError(addEventError);

    events.push({
      id: makeId(),
      name,
      status,
      tasks: [],
      budget: { SGA: 0, OBI: 0 },
      expanded: false,
    });
    persist();
    addEventForm.reset();
    renderAll();
  });

  resetBtn.addEventListener("click", () => {
    const confirmed = window.confirm("This will delete all events, tasks, and budget data. Continue?");
    if (!confirmed) return;
    events = [];
    Storage.clearEvents();
    renderAll();
  });

  renderAll();
})();
