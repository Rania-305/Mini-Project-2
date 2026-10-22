// Single access point for localStorage. No other file should call localStorage directly.
const Storage = (() => {
  const STORAGE_KEY = "club-event-delegator:events";

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isValidStatus(value) {
    return value === "Planning" || value === "Active" || value === "Incomplete" || value === "Done";
  }

  function isValidSource(value) {
    return value === "SGA" || value === "OBI";
  }

  function isValidUrl(value) {
    if (!isNonEmptyString(value)) return false;
    try {
      new URL(value);
      return true;
    } catch (err) {
      return false;
    }
  }

  function isValidCategory(value) {
    return value === "Food" || value === "Crafts" || value === "Supplies" || value === "Other";
  }

  // Drops/repairs malformed entries so a corrupted or hand-edited localStorage value can't crash the app.
  function sanitizeTask(rawTask) {
    if (!rawTask || typeof rawTask !== "object") return null;
    if (!isNonEmptyString(rawTask.id) || !isNonEmptyString(rawTask.name)) return null;
    return {
      id: rawTask.id,
      name: rawTask.name,
      owner: typeof rawTask.owner === "string" ? rawTask.owner : "",
      deadline: typeof rawTask.deadline === "string" ? rawTask.deadline : "",
      done: rawTask.done === true,
    };
  }

  function sanitizeLink(rawLink) {
    if (!rawLink || typeof rawLink !== "object") return null;
    if (!isNonEmptyString(rawLink.id) || !isNonEmptyString(rawLink.label) || !isNonEmptyString(rawLink.url)) {
      return null;
    }
    return {
      id: rawLink.id,
      label: rawLink.label,
      url: rawLink.url,
    };
  }

  function sanitizeBudgetEntry(rawEntry) {
    if (!rawEntry || typeof rawEntry !== "object") return null;
    if (!isNonEmptyString(rawEntry.id)) return null;
    const amount = Number(rawEntry.amount);
    if (!Number.isFinite(amount) || amount < 0) return null;
    if (!isValidSource(rawEntry.source)) return null;
    return {
      id: rawEntry.id,
      amount,
      category: isValidCategory(rawEntry.category) ? rawEntry.category : "Other",
      source: rawEntry.source,
    };
  }

  // Older saves stored a single { SGA, OBI } total instead of itemized entries; convert it to one entry per source.
  function migrateLegacyBudget(rawBudget) {
    if (!rawBudget || typeof rawBudget !== "object") return [];
    const entries = [];
    const sga = Number(rawBudget.SGA);
    const obi = Number(rawBudget.OBI);
    if (Number.isFinite(sga) && sga > 0) {
      entries.push({ id: `legacy-sga-${Date.now()}`, amount: sga, category: "Other", source: "SGA" });
    }
    if (Number.isFinite(obi) && obi > 0) {
      entries.push({ id: `legacy-obi-${Date.now()}`, amount: obi, category: "Other", source: "OBI" });
    }
    return entries;
  }

  function sanitizeEvent(rawEvent) {
    if (!rawEvent || typeof rawEvent !== "object") return null;
    if (!isNonEmptyString(rawEvent.id) || !isNonEmptyString(rawEvent.name)) return null;
    const tasks = Array.isArray(rawEvent.tasks)
      ? rawEvent.tasks.map(sanitizeTask).filter(Boolean)
      : [];
    const budgetEntries = Array.isArray(rawEvent.budgetEntries)
      ? rawEvent.budgetEntries.map(sanitizeBudgetEntry).filter(Boolean)
      : migrateLegacyBudget(rawEvent.budget);
    const links = Array.isArray(rawEvent.links) ? rawEvent.links.map(sanitizeLink).filter(Boolean) : [];
    return {
      id: rawEvent.id,
      name: rawEvent.name,
      status: isValidStatus(rawEvent.status) ? rawEvent.status : "Planning",
      tasks,
      budgetEntries,
      notes: typeof rawEvent.notes === "string" ? rawEvent.notes : "",
      links,
      expanded: rawEvent.expanded === true,
    };
  }

  function loadEvents() {
    let raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return [];
    }
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(sanitizeEvent).filter(Boolean);
    } catch (err) {
      return [];
    }
  }

  function saveEvents(events) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      // Storage unavailable (e.g. quota exceeded/private mode) — fail silently, in-memory state still works.
    }
  }

  function clearEvents() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // ignore
    }
  }

  return {
    loadEvents,
    saveEvents,
    clearEvents,
    isValidStatus,
    isValidSource,
    isValidCategory,
    isValidUrl,
    isNonEmptyString,
  };
})();
