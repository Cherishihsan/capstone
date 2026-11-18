document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const menuBtn = document.querySelector('#menuBtn');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); });
  }

  window.showToast = (message, type = 'info') => {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div>${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 5000);
  };

  window.openModal = (id) => { const m = document.getElementById(id); if(m) m.classList.add('active'); };
  window.closeModal = (id) => { const m = document.getElementById(id); if(m) m.classList.remove('active'); };

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('active'); });
  });

  const setAllHadirBtn = document.getElementById('setAllHadir');
  if (setAllHadirBtn) {
    setAllHadirBtn.addEventListener('click', () => {
      document.querySelectorAll('input[value="Hadir"]').forEach(r => r.checked = true);
      updateSummary();
    });
  }

  const updateSummary = () => {
    const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0, Terlambat: 0 };
    document.querySelectorAll('input[type="radio"]:checked').forEach(r => { if(counts[r.value] !== undefined) counts[r.value]++; });
    ['Hadir', 'Izin', 'Sakit', 'Alpa', 'Terlambat'].forEach(s => {
      const el = document.getElementById(`count${s}`);
      if(el) el.textContent = counts[s];
    });
  };

  document.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', updateSummary));
});
