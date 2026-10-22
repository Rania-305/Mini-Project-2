// Pure helper functions for task-progress and budget math. No DOM or storage access here.
const Calculations = (() => {
  function taskProgress(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  function eventSpend(event) {
    const totals = event.budgetEntries.reduce(
      (acc, entry) => {
        acc[entry.source] += entry.amount;
        return acc;
      },
      { SGA: 0, OBI: 0 }
    );
    return { sga: totals.SGA, obi: totals.OBI, total: totals.SGA + totals.OBI };
  }

  function eventCompletionSummary(events) {
    const total = events.length;
    const completed = events.filter((e) => e.status === "Done").length;
    return { completed, total };
  }

  function semesterTotals(events) {
    return events.reduce(
      (totals, event) => {
        const spend = eventSpend(event);
        return {
          sga: totals.sga + spend.sga,
          obi: totals.obi + spend.obi,
          combined: totals.combined + spend.total,
        };
      },
      { sga: 0, obi: 0, combined: 0 }
    );
  }

  function formatCurrency(amount) {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return { taskProgress, eventSpend, eventCompletionSummary, semesterTotals, formatCurrency };
})();
