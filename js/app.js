// App state, rendering, and event wiring.
(() => {
  let events = Storage.loadEvents();

  const eventListEl = document.getElementById("event-list");
  const emptyStateEl = document.getElementById("empty-state");
  const addEventForm = document.getElementById("add-event-form");
  const addEventError = document.getElementById("add-event-error");
  const resetBtn = document.getElementById("reset-btn");
  const resetConfirmEl = document.getElementById("reset-confirm");
  const resetConfirmBtn = document.getElementById("reset-confirm-btn");
  const resetCancelBtn = document.getElementById("reset-cancel-btn");
  const eventCardTemplate = document.getElementById("event-card-template");
  const taskRowTemplate = document.getElementById("task-row-template");
  const budgetRowTemplate = document.getElementById("budget-row-template");
  const linkRowTemplate = document.getElementById("link-row-template");

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

  function renderCompletedSummary() {
    const summary = Calculations.eventCompletionSummary(events);
    document.getElementById("completed-summary-value").textContent = `${summary.completed} / ${summary.total}`;
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

  function renderBudgetRow(event, entry) {
    const node = budgetRowTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.budgetId = entry.id;
    node.querySelector(".budget-amount").textContent = Calculations.formatCurrency(entry.amount);
    const categoryLabel = entry.category === "Other" && entry.customCategory ? entry.customCategory : entry.category;
    node.querySelector(".budget-meta").textContent = `${categoryLabel} · ${entry.source}`;

    node.querySelector(".delete-budget-btn").addEventListener("click", () => {
      event.budgetEntries = event.budgetEntries.filter((b) => b.id !== entry.id);
      persist();
      renderAll();
    });

    return node;
  }

  function renderLinkRow(event, link) {
    const node = linkRowTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.linkId = link.id;
    const anchor = node.querySelector(".link-anchor");
    anchor.href = link.url;
    anchor.textContent = link.label;
    node.querySelector(".link-label").textContent = link.url;

    node.querySelector(".delete-link-btn").addEventListener("click", () => {
      event.links = event.links.filter((l) => l.id !== link.id);
      persist();
      renderAll();
    });

    return node;
  }

  function renderEventCard(event) {
    const node = eventCardTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.eventId = event.id;

    node.querySelector(".event-name").textContent = event.name;
    const statusSelect = node.querySelector(".event-status-select");
    statusSelect.value = event.status;
    statusSelect.classList.add(`status-${event.status.toLowerCase()}`);
    statusSelect.addEventListener("change", () => {
      event.status = statusSelect.value;
      persist();
      renderAll();
    });

    const progress = Calculations.taskProgress(event.tasks);
    const progressFill = node.querySelector(".progress-bar-fill");
    progressFill.style.width = `${progress.percent}%`;
    node.querySelector(".progress-fraction").textContent = `${progress.completed}/${progress.total} tasks done`;
    const allTasksDone = progress.total > 0 && progress.completed === progress.total;
    progressFill.classList.toggle("all-done", allTasksDone);
    node.querySelector(".tasks-done-badge").hidden = !allTasksDone;

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

    // Budget list
    const budgetListEl = node.querySelector(".budget-list");
    event.budgetEntries.forEach((entry) => {
      budgetListEl.appendChild(renderBudgetRow(event, entry));
    });

    // Add-budget form
    const addBudgetForm = node.querySelector(".add-budget-form");
    const budgetErrorEl = node.querySelector(".budget-error");
    const categoryInput = addBudgetForm.querySelector(".budget-category-input");
    const otherFieldEl = addBudgetForm.querySelector(".budget-other-field");
    const otherInput = addBudgetForm.querySelector(".budget-other-input");
    categoryInput.addEventListener("change", () => {
      otherFieldEl.hidden = categoryInput.value !== "Other";
    });
    addBudgetForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const amountInput = addBudgetForm.querySelector(".budget-amount-input");
      const sourceInput = addBudgetForm.querySelector(".budget-source-input");
      const amount = Number(amountInput.value);
      const category = categoryInput.value;
      const customCategory = otherInput.value.trim();
      const source = sourceInput.value;

      if (!Number.isFinite(amount) || amount < 0) {
        showError(budgetErrorEl, "Amount must be a non-negative number.");
        return;
      }
      if (!Storage.isValidCategory(category)) {
        showError(budgetErrorEl, "Please choose a valid category.");
        return;
      }
      if (category === "Other" && !Storage.isNonEmptyString(customCategory)) {
        showError(budgetErrorEl, "Please specify the \"Other\" category.");
        return;
      }
      if (!Storage.isValidSource(source)) {
        showError(budgetErrorEl, "Please choose a valid budget source.");
        return;
      }
      clearError(budgetErrorEl);

      event.budgetEntries.push({
        id: makeId(),
        amount,
        category,
        customCategory: category === "Other" ? customCategory : "",
        source,
      });
      persist();
      renderAll();
    });

    // Notes
    const notesInput = node.querySelector(".details-notes-input");
    notesInput.value = event.notes;
    notesInput.addEventListener("change", () => {
      event.notes = notesInput.value;
      persist();
    });

    // Link list
    const linkListEl = node.querySelector(".details-link-list");
    event.links.forEach((link) => {
      linkListEl.appendChild(renderLinkRow(event, link));
    });

    // Add-link form
    const addLinkForm = node.querySelector(".add-link-form");
    const linkErrorEl = node.querySelector(".details-link-error");
    addLinkForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const labelInput = addLinkForm.querySelector(".details-link-label-input");
      const urlInput = addLinkForm.querySelector(".details-link-url-input");
      const label = labelInput.value.trim();
      const url = urlInput.value.trim();

      if (!Storage.isNonEmptyString(label)) {
        showError(linkErrorEl, "Link label is required.");
        return;
      }
      if (!Storage.isValidUrl(url)) {
        showError(linkErrorEl, "Please enter a valid URL.");
        return;
      }
      clearError(linkErrorEl);

      event.links.push({ id: makeId(), label, url });
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
    renderCompletedSummary();
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
      budgetEntries: [],
      notes: "",
      links: [],
      expanded: false,
    });
    persist();
    addEventForm.reset();
    renderAll();
  });

  resetBtn.addEventListener("click", () => {
    resetBtn.hidden = true;
    resetConfirmEl.hidden = false;
  });

  resetCancelBtn.addEventListener("click", () => {
    resetConfirmEl.hidden = true;
    resetBtn.hidden = false;
  });

  resetConfirmBtn.addEventListener("click", () => {
    events = [];
    Storage.clearEvents();
    resetConfirmEl.hidden = true;
    resetBtn.hidden = false;
    renderAll();
  });

  renderAll();
})();
