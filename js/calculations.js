// Pure helper functions for task-progress and budget math. No DOM or storage access here.
const Calculations = (() => {
  function taskProgress(tasks) {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.done).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percent };
  }

  function eventSpend(event) {
    const sga = event.budget.SGA || 0;
    const obi = event.budget.OBI || 0;
    return { sga, obi, total: sga + obi };
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

  return { taskProgress, eventSpend, semesterTotals, formatCurrency };
})();
