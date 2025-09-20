/**
 * Logica frontend per il gestionale turni bar
 * Gestisce l'interfaccia utente, API calls e stato dell'applicazione
 */

// Stato globale dell'applicazione
const AppState = {
  currentUser: null,
  shifts: [],
  filteredShifts: [],
  currentShift: null,
  isLoading: false
};

// Elementi DOM
const elements = {
  welcomeScreen: document.getElementById('welcomeScreen'),
  dashboard: document.getElementById('dashboard'),
  userInfo: document.getElementById('userInfo'),
  userName: document.getElementById('userName'),
  userForm: document.getElementById('userForm'),
  shiftsGrid: document.getElementById('shiftsGrid'),
  loadingShifts: document.getElementById('loadingShifts'),
  noShifts: document.getElementById('noShifts'),
  bookingModal: document.getElementById('bookingModal'),
  successModal: document.getElementById('successModal'),
  errorToast: document.getElementById('errorToast'),
  loadingOverlay: document.getElementById('loadingOverlay'),
  
  // Stats elements
  totalShifts: document.getElementById('totalShifts'),
  availableShifts: document.getElementById('availableShifts'),
  bookedShifts: document.getElementById('bookedShifts'),
  myShifts: document.getElementById('myShifts'),
  
  // Filter elements
  dateFilter: document.getElementById('dateFilter'),
  locationFilter: document.getElementById('locationFilter')
};

// Inizializzazione app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

/**
 * Inizializza l'applicazione
 */
async function initializeApp() {
  try {
    // Controlla se c'è un utente salvato nel localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      AppState.currentUser = JSON.parse(savedUser);
      showDashboard();
      await loadShifts();
      await updateStats();
    } else {
      showWelcomeScreen();
    }
    
    // Controlla se c'è un userId nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user') || window.location.pathname.split('/user/')[1];
    
    if (userId && !AppState.currentUser) {
      await loadUserFromId(userId);
    }
    
  } catch (error) {
    console.error('Errore durante l\'inizializzazione:', error);
    showError('Errore durante l\'inizializzazione dell\'applicazione');
  }
}

/**
 * Carica un utente tramite ID
 */
async function loadUserFromId(userId) {
  try {
    const response = await fetch(`/api/users/${userId}`);
    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        AppState.currentUser = result.data;
        localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
        showDashboard();
        await loadShifts();
        await updateStats();
      } else {
        throw new Error(result.message || 'Utente non trovato');
      }
    } else {
      throw new Error('Utente non trovato');
    }
  } catch (error) {
    console.error('Errore nel caricamento utente:', error);
    showError('Utente non trovato o link non valido');
    showWelcomeScreen();
  }
}

/**
 * Mostra la schermata di benvenuto
 */
function showWelcomeScreen() {
  elements.welcomeScreen.style.display = 'block';
  elements.dashboard.style.display = 'none';
  elements.userInfo.style.display = 'none';
}

/**
 * Mostra la dashboard
 */
function showDashboard() {
  elements.welcomeScreen.style.display = 'none';
  elements.dashboard.style.display = 'block';
  elements.userInfo.style.display = 'flex';
  
  if (AppState.currentUser) {
    elements.userName.textContent = AppState.currentUser.name;
  }
}

/**
 * Gestisce il submit del form utente
 */
elements.userForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const userData = {
    name: formData.get('name'),
    email: formData.get('email'),
    discordId: formData.get('discordId')
  };
  
  try {
    showLoadingOverlay();
    
    const response = await fetch('/api/users/generate-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      AppState.currentUser = result.data.userData;
      AppState.currentUser.userId = result.data.userId;
      AppState.currentUser.userLink = result.data.userLink;
      
      localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
      showDashboard();
      await loadShifts();
      await updateStats();
      
      // Mostra il link utente
      showSuccessModal(
        'Benvenuto!',
        `Il tuo link personale è: ${result.data.userLink}`,
        [
          { type: 'success', message: 'Account creato con successo' }
        ]
      );
    } else {
      throw new Error(result.message || 'Errore nella creazione dell\'account');
    }
    
  } catch (error) {
    console.error('Errore nella creazione utente:', error);
    showError(error.message || 'Errore nella creazione dell\'account');
  } finally {
    hideLoadingOverlay();
  }
});

/**
 * Carica i turni disponibili
 */
async function loadShifts() {
  try {
    elements.loadingShifts.style.display = 'block';
    elements.shiftsGrid.style.display = 'none';
    elements.noShifts.style.display = 'none';
    
    const response = await fetch('/api/shifts');
    const result = await response.json();
    
      if (result.success) {
        AppState.shifts = result.data;
        AppState.filteredShifts = [...AppState.shifts];
        renderShifts();
        updateLocationFilter();
        
        // Mostra banner demo se in modalità demo
        if (result.demo) {
          showDemoBanner();
        }
      } else {
        throw new Error(result.message || 'Errore nel caricamento dei turni');
      }
    
  } catch (error) {
    console.error('Errore nel caricamento turni:', error);
    showError('Errore nel caricamento dei turni');
    elements.noShifts.style.display = 'block';
  } finally {
    elements.loadingShifts.style.display = 'none';
  }
}

/**
 * Renderizza i turni nella griglia
 */
function renderShifts() {
  if (AppState.filteredShifts.length === 0) {
    elements.noShifts.style.display = 'block';
    elements.shiftsGrid.style.display = 'none';
    return;
  }
  
  elements.noShifts.style.display = 'none';
  elements.shiftsGrid.style.display = 'grid';
  
  elements.shiftsGrid.innerHTML = AppState.filteredShifts.map(shift => `
    <div class="shift-card" onclick="openBookingModal('${shift.id}')">
      <div class="shift-header">
        <div>
          <h3 class="shift-title">${escapeHtml(shift.title)}</h3>
          <p class="shift-date">${formatDate(shift.date)}</p>
        </div>
        <span class="shift-status ${shift.status.toLowerCase()}">${shift.status}</span>
      </div>
      
      <div class="shift-details">
        <div class="shift-detail">
          <i class="fas fa-clock"></i>
          <span>${shift.startTime} - ${shift.endTime}</span>
        </div>
        <div class="shift-detail">
          <i class="fas fa-map-marker-alt"></i>
          <span>${escapeHtml(shift.location || 'Associazione Culturale')}</span>
        </div>
        ${shift.description ? `
          <div class="shift-description">
            ${escapeHtml(shift.description)}
          </div>
        ` : ''}
      </div>
      
      <div class="shift-actions">
        <button class="btn btn-primary" onclick="event.stopPropagation(); openBookingModal('${shift.id}')">
          <i class="fas fa-calendar-plus"></i> Prenota
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Filtra i turni
 */
function filterShifts() {
  const dateFilter = elements.dateFilter.value;
  const locationFilter = elements.locationFilter.value;
  
  AppState.filteredShifts = AppState.shifts.filter(shift => {
    const matchesDate = !dateFilter || shift.date === dateFilter;
    const matchesLocation = !locationFilter || 
      (shift.location && shift.location.toLowerCase().includes(locationFilter.toLowerCase()));
    
    return matchesDate && matchesLocation;
  });
  
  renderShifts();
}

/**
 * Pulisce i filtri
 */
function clearFilters() {
  elements.dateFilter.value = '';
  elements.locationFilter.value = '';
  AppState.filteredShifts = [...AppState.shifts];
  renderShifts();
}

/**
 * Aggiorna il filtro delle location
 */
function updateLocationFilter() {
  const locations = [...new Set(AppState.shifts.map(shift => shift.location).filter(Boolean))];
  
  elements.locationFilter.innerHTML = '<option value="">Tutti i luoghi</option>' +
    locations.map(location => `<option value="${escapeHtml(location)}">${escapeHtml(location)}</option>`).join('');
}

/**
 * Aggiorna le statistiche
 */
async function updateStats() {
  try {
    const response = await fetch('/api/shifts/stats');
    const result = await response.json();
    
    if (result.success) {
      const stats = result.data;
      elements.totalShifts.textContent = stats.total;
      elements.availableShifts.textContent = stats.available;
      elements.bookedShifts.textContent = stats.booked;
      
      // Calcola i turni dell'utente corrente
      const myShiftsCount = AppState.shifts.filter(shift => 
        shift.status === 'Prenotato' && shift.user === AppState.currentUser?.name
      ).length;
      elements.myShifts.textContent = myShiftsCount;
    }
  } catch (error) {
    console.error('Errore nel caricamento statistiche:', error);
  }
}

/**
 * Apre il modal di prenotazione
 */
function openBookingModal(shiftId) {
  const shift = AppState.shifts.find(s => s.id === shiftId);
  if (!shift) return;
  
  AppState.currentShift = shift;
  
  // Popola il preview del turno
  document.getElementById('shiftPreview').innerHTML = `
    <h4>${escapeHtml(shift.title)}</h4>
    <p><strong>Data:</strong> ${formatDate(shift.date)}</p>
    <p><strong>Orario:</strong> ${shift.startTime} - ${shift.endTime}</p>
    <p><strong>Luogo:</strong> ${escapeHtml(shift.location || 'Associazione Culturale')}</p>
    ${shift.description ? `<p><strong>Descrizione:</strong> ${escapeHtml(shift.description)}</p>` : ''}
  `;
  
  // Reset form
  document.getElementById('bookingForm').reset();
  document.getElementById('enableEmailNotification').checked = !!AppState.currentUser?.email;
  document.getElementById('enableDiscordNotification').checked = !!AppState.currentUser?.discordId;
  document.getElementById('enableCalendarEvent').checked = !!AppState.currentUser?.email;
  
  showModal(elements.bookingModal);
}

/**
 * Chiude il modal di prenotazione
 */
function closeBookingModal() {
  hideModal(elements.bookingModal);
  AppState.currentShift = null;
}

/**
 * Gestisce il submit del form di prenotazione
 */
document.getElementById('bookingForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  if (!AppState.currentUser || !AppState.currentShift) {
    showError('Errore: utente o turno non valido');
    return;
  }
  
  const formData = new FormData(e.target);
  const userInfo = {
    ...AppState.currentUser,
    notes: formData.get('notes')
  };
  
  const enableEmail = document.getElementById('enableEmailNotification').checked;
  const enableDiscord = document.getElementById('enableDiscordNotification').checked;
  const enableCalendar = document.getElementById('enableCalendarEvent').checked;
  
  try {
    showLoadingOverlay();
    closeBookingModal();
    
    const response = await fetch(`/api/shifts/${AppState.currentShift.id}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userInfo,
        enableCalendar,
        enableDiscord,
        enableEmail
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Aggiorna i turni
      await loadShifts();
      await updateStats();
      
      // Mostra risultati notifiche
      showSuccessModal(
        'Prenotazione Confermata!',
        'Il tuo turno è stato prenotato con successo.',
        result.data.notifications || []
      );
      
      // Salva la prenotazione nell'utente
      if (result.data.userInfo) {
        AppState.currentUser = result.data.userInfo;
        localStorage.setItem('currentUser', JSON.stringify(AppState.currentUser));
      }
      
    } else {
      throw new Error(result.message || 'Errore nella prenotazione');
    }
    
  } catch (error) {
    console.error('Errore nella prenotazione:', error);
    showError(error.message || 'Errore nella prenotazione del turno');
  } finally {
    hideLoadingOverlay();
  }
});

/**
 * Aggiorna i turni
 */
async function refreshShifts() {
  await loadShifts();
  await updateStats();
}

/**
 * Logout utente
 */
function logout() {
  localStorage.removeItem('currentUser');
  AppState.currentUser = null;
  AppState.shifts = [];
  AppState.filteredShifts = [];
  showWelcomeScreen();
}

/**
 * Mostra un modal
 */
function showModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/**
 * Nasconde un modal
 */
function hideModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

/**
 * Mostra il modal di successo
 */
function showSuccessModal(title, message, notifications = []) {
  document.querySelector('#successModal h3').textContent = title;
  document.getElementById('successMessage').textContent = message;
  
  const notificationResults = document.getElementById('notificationResults');
  if (notifications.length > 0) {
    notificationResults.innerHTML = notifications.map(notif => `
      <div class="notification-result ${notif.success ? 'success' : 'error'}">
        <i class="fas fa-${notif.success ? 'check' : 'times'}"></i>
        <span>${notif.type}: ${notif.message}</span>
      </div>
    `).join('');
    notificationResults.style.display = 'block';
  } else {
    notificationResults.style.display = 'none';
  }
  
  showModal(elements.successModal);
}

/**
 * Chiude il modal di successo
 */
function closeSuccessModal() {
  hideModal(elements.successModal);
}

/**
 * Mostra un errore
 */
function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  elements.errorToast.classList.add('show');
  
  setTimeout(() => {
    hideErrorToast();
  }, 5000);
}

/**
 * Nasconde il toast di errore
 */
function hideErrorToast() {
  elements.errorToast.classList.remove('show');
}

/**
 * Mostra il loading overlay
 */
function showLoadingOverlay() {
  elements.loadingOverlay.style.display = 'flex';
}

/**
 * Nasconde il loading overlay
 */
function hideLoadingOverlay() {
  elements.loadingOverlay.style.display = 'none';
}

/**
 * Formatta una data per la visualizzazione
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Escapa HTML per prevenire XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Gestisce gli eventi di chiusura modali
 */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
    hideModal(e.target);
  }
});

/**
 * Gestisce la chiusura modali con ESC
 */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      hideModal(activeModal);
    }
  }
});

/**
 * Mostra banner di demo
 */
function showDemoBanner() {
  const banner = document.createElement('div');
  banner.id = 'demoBanner';
  banner.innerHTML = `
    <div class="demo-banner">
      <div class="demo-content">
        <i class="fas fa-info-circle"></i>
        <span><strong>Modalità DEMO</strong> - Stai utilizzando dati simulati. Per configurare i servizi reali, segui la guida SETUP.md</span>
      </div>
      <button class="demo-close" onclick="hideDemoBanner()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.body.insertBefore(banner, document.body.firstChild);
}

/**
 * Nasconde banner di demo
 */
function hideDemoBanner() {
  const banner = document.getElementById('demoBanner');
  if (banner) {
    banner.remove();
  }
}

// Auto-refresh dei turni ogni 5 minuti
setInterval(async () => {
  if (AppState.currentUser) {
    await loadShifts();
    await updateStats();
  }
}, 5 * 60 * 1000);
