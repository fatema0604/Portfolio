document.addEventListener('DOMContentLoaded', () => {

  /* ---------- toast ---------- */
  const toastEl = document.getElementById('toast');
  let toastTimer;
  function toast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
  }

  /* ---------- live risk dashboard ---------- */
  const tbody = document.getElementById('dash-tbody');
  const dashUpdated = document.getElementById('dash-updated');
  function riskLabel(r){ return r.charAt(0).toUpperCase() + r.slice(1); }

  function renderDashboard(rows){
    if(!tbody) return;
    tbody.innerHTML = rows
      .sort((a,b) => b.score - a.score)
      .map(row => `
        <tr>
          <td>${row.name}</td>
          <td><span class="risk-pill risk-${row.risk}">${riskLabel(row.risk)}</span></td>
          <td>${row.score}</td>
          <td>${row.rainfall_mm_24h} mm</td>
        </tr>`).join('');
    if(dashUpdated) dashUpdated.textContent = 'Last updated ' + new Date(rows[0]?.updated || Date.now()).toLocaleTimeString();
  }

  if(tbody){
    renderDashboard(MDoNER_DB.getDistricts());
    setInterval(() => renderDashboard(MDoNER_DB.tickDistricts()), 6000);
  }

  /* ---------- citizen report form ---------- */
  const reportForm = document.getElementById('report-form');
  const reportListEl = document.getElementById('report-list');

  function renderReports(){
    if(!reportListEl) return;
    const items = MDoNER_DB.getReports();
    if(!items.length){
      reportListEl.innerHTML = '<p class="empty-note">No field reports yet — submitted reports appear here.</p>';
      return;
    }
    reportListEl.innerHTML = items.slice(0, 12).map(r => `
      <div class="report-item">
        <div class="r-top"><span>${r.district}</span><span>${new Date(r.created).toLocaleString()}</span></div>
        <div class="r-body">${r.observation}</div>
      </div>`).join('');
  }
  renderReports();

  if(reportForm){
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(reportForm).entries());
      if(!data.district || !data.observation){
        toast('Please fill district and observation.');
        return;
      }
      MDoNER_DB.addReport(data);
      renderReports();
      reportForm.reset();
      toast('Field report submitted. Thank you.');
    });
  }

  /* ---------- alert subscription form ---------- */
  const subForm = document.getElementById('subscribe-form');
  if(subForm){
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(subForm).entries());
      if(!data.contact || !data.district){
        toast('Please add a contact and district.');
        return;
      }
      MDoNER_DB.addSubscriber(data);
      subForm.reset();
      toast('Subscribed for alerts on ' + data.district + '.');
    });
  }

  /* ---------- populate district <select> options from DB ---------- */
  document.querySelectorAll('select[data-fill="districts"]').forEach(sel => {
    MDoNER_DB.DISTRICTS.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      sel.appendChild(opt);
    });
  });

});
