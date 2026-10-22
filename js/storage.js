// Single access point for localStorage. No other file should call localStorage directly.
const Storage = (() => {
  const STORAGE_KEY = "club-event-delegator:events";

  function isNonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function isValidStatus(value) {
    return value === "Planning" || value === "Active" || value === "Done";
  }

  function isValidSource(value) {
    return value === "SGA" || value === "OBI";
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

  function sanitizeBudget(rawBudget) {
    if (!rawBudget || typeof rawBudget !== "object") return { SGA: 0, OBI: 0 };
    const sga = Number(rawBudget.SGA);
    const obi = Number(rawBudget.OBI);
    return {
      SGA: Number.isFinite(sga) && sga >= 0 ? sga : 0,
      OBI: Number.isFinite(obi) && obi >= 0 ? obi : 0,
    };
  }

  function sanitizeEvent(rawEvent) {
    if (!rawEvent || typeof rawEvent !== "object") return null;
    if (!isNonEmptyString(rawEvent.id) || !isNonEmptyString(rawEvent.name)) return null;
    const tasks = Array.isArray(rawEvent.tasks)
      ? rawEvent.tasks.map(sanitizeTask).filter(Boolean)
      : [];
    return {
      id: rawEvent.id,
      name: rawEvent.name,
      status: isValidStatus(rawEvent.status) ? rawEvent.status : "Planning",
      tasks,
      budget: sanitizeBudget(rawEvent.budget),
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
    isNonEmptyString,
  };
})();
