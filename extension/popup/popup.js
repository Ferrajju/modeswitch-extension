/**
 * Popup UI - Controlador principal de la interfaz
 */

// Estado de la aplicación
let currentModes = [];
let editingModeId = null;
let openDropdownId = null;
let selectedIcon = '💼';

// Elementos del DOM
const elements = {
  // Botones principales
  btnSettings: document.getElementById('btn-settings'),
  btnSaveCurrent: document.getElementById('btn-save-current'),
  btnCloseAll: document.getElementById('btn-close-all'),
  btnUnlockPro: document.getElementById('btn-unlock-pro'),
  
  // Icon picker
  iconPicker: document.getElementById('icon-picker'),
  
  // Lista y contador
  modesList: document.getElementById('modes-list'),
  modesCount: document.getElementById('modes-count'),
  
  // Footer
  footerFree: document.getElementById('footer-free'),
  footerPro: document.getElementById('footer-pro'),
  
  // Modal crear/editar modo
  modalMode: document.getElementById('modal-mode'),
  modalTitle: document.getElementById('modal-title'),
  modeName: document.getElementById('mode-name'),
  saveCurrentTabs: document.getElementById('save-current-tabs'),
  openIn: document.getElementById('open-in'),
  btnCloseModal: document.getElementById('btn-close-modal'),
  btnCancelMode: document.getElementById('btn-cancel-mode'),
  btnSaveMode: document.getElementById('btn-save-mode'),
  
  // Modal URLs
  modalUrls: document.getElementById('modal-urls'),
  urlsList: document.getElementById('urls-list'),
  btnAddUrl: document.getElementById('btn-add-url'),
  btnCloseUrlsModal: document.getElementById('btn-close-urls-modal'),
  btnCancelUrls: document.getElementById('btn-cancel-urls'),
  btnSaveUrls: document.getElementById('btn-save-urls'),
  
  // Modal ajustes
  modalSettings: document.getElementById('modal-settings'),
  closeOtherTabs: document.getElementById('close-other-tabs'),
  btnCloseSettings: document.getElementById('btn-close-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  
  // Modal Pro
  modalPro: document.getElementById('modal-pro'),
  licenseKey: document.getElementById('license-key'),
  btnClosePro: document.getElementById('btn-close-pro'),
  btnCancelPro: document.getElementById('btn-cancel-pro'),
  btnActivatePro: document.getElementById('btn-activate-pro'),
  
  // Toast
  toast: document.getElementById('toast')
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadModes();
  await loadSettings();
  await updateLicenseUI();
  setupEventListeners();
}

// ============================================
// CARGA DE DATOS
// ============================================

async function loadModes() {
  currentModes = await Modes.getAll();
  renderModes();
}

async function loadSettings() {
  const settings = await Storage.getSettings();
  elements.closeOtherTabs.checked = settings.closeOtherTabs || false;
}

async function updateLicenseUI() {
  const info = await License.getLicenseInfo();
  
  if (info.isPro) {
    // Mostrar footer Pro, ocultar footer gratis
    elements.footerFree.classList.add('hidden');
    elements.footerPro.classList.remove('hidden');
  } else {
    // Mostrar footer gratis, ocultar footer Pro
    elements.footerFree.classList.remove('hidden');
    elements.footerPro.classList.add('hidden');
    elements.modesCount.textContent = `${info.modesCount}/${info.modesLimit} modos`;
  }
}

// ============================================
// RENDERIZADO
// ============================================

function renderModes() {
  if (currentModes.length === 0) {
    elements.modesList.innerHTML = '<p class="empty-state">No tienes modos guardados</p>';
    return;
  }

  elements.modesList.innerHTML = currentModes.map(mode => `
    <div class="mode-item" data-id="${mode.id}">
      <div class="mode-info">
        <span class="mode-icon">${mode.icon || '💼'}</span>
        <div class="mode-details">
          <span class="mode-name">${escapeHtml(mode.name)}</span>
          <span class="mode-urls-count">${mode.urls.length} pestaña${mode.urls.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="mode-actions">
        <button class="btn-activate" data-action="activate" data-id="${mode.id}">Activar</button>
        <div class="dropdown">
          <button class="btn-menu" data-action="menu" data-id="${mode.id}">⋮</button>
          <div class="dropdown-menu hidden" data-menu-id="${mode.id}">
            <button class="dropdown-item" data-action="rename" data-id="${mode.id}">Renombrar</button>
            <button class="dropdown-item" data-action="edit-urls" data-id="${mode.id}">Editar URLs</button>
            <button class="dropdown-item danger" data-action="delete" data-id="${mode.id}">Borrar</button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Botón guardar pestañas actuales
  elements.btnSaveCurrent.addEventListener('click', handleSaveCurrentTabs);
  
  // Botón cerrar todas las pestañas
  elements.btnCloseAll.addEventListener('click', handleCloseAllTabs);
  
  // Botón ajustes
  elements.btnSettings.addEventListener('click', () => openModal(elements.modalSettings));
  
  // Botón Pro
  elements.btnUnlockPro.addEventListener('click', () => openModal(elements.modalPro));
  
  // Icon picker
  elements.iconPicker.addEventListener('click', handleIconPick);
  
  // Lista de modos (delegación de eventos)
  elements.modesList.addEventListener('click', handleModesListClick);
  
  // Modal crear/editar modo
  elements.btnCloseModal.addEventListener('click', () => closeModal(elements.modalMode));
  elements.btnCancelMode.addEventListener('click', () => closeModal(elements.modalMode));
  elements.btnSaveMode.addEventListener('click', handleSaveMode);
  elements.modalMode.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.modalMode));
  
  // Modal URLs
  elements.btnCloseUrlsModal.addEventListener('click', () => closeModal(elements.modalUrls));
  elements.btnCancelUrls.addEventListener('click', () => closeModal(elements.modalUrls));
  elements.btnSaveUrls.addEventListener('click', handleSaveUrls);
  elements.btnAddUrl.addEventListener('click', addUrlInput);
  elements.modalUrls.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.modalUrls));
  
  // Modal ajustes
  elements.btnCloseSettings.addEventListener('click', () => closeModal(elements.modalSettings));
  elements.btnSaveSettings.addEventListener('click', handleSaveSettings);
  elements.modalSettings.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.modalSettings));
  
  // Modal Pro
  elements.btnClosePro.addEventListener('click', () => closeModal(elements.modalPro));
  elements.btnCancelPro.addEventListener('click', () => closeModal(elements.modalPro));
  elements.btnActivatePro.addEventListener('click', handleActivatePro);
  elements.modalPro.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.modalPro));
  
  // Cerrar dropdowns al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      closeAllDropdowns();
    }
  });
}

// ============================================
// HANDLERS
// ============================================

async function handleSaveCurrentTabs() {
  // Verificar límite
  const { canCreate, reason } = await License.canCreateMode();
  if (!canCreate) {
    showToast(reason, 'error');
    return;
  }

  // Abrir modal para crear modo
  editingModeId = null;
  elements.modalTitle.textContent = 'Crear Modo';
  elements.modeName.value = '';
  elements.saveCurrentTabs.checked = true;
  elements.saveCurrentTabs.parentElement.style.display = 'flex';
  elements.openIn.value = 'currentWindow';
  selectIcon('💼');
  openModal(elements.modalMode);
  elements.modeName.focus();
}

function handleIconPick(e) {
  const btn = e.target.closest('.icon-option');
  if (!btn) return;
  
  const icon = btn.dataset.icon;
  selectIcon(icon);
}

function selectIcon(icon) {
  selectedIcon = icon;
  elements.iconPicker.querySelectorAll('.icon-option').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.icon === icon);
  });
}

async function handleCloseAllTabs() {
  if (!confirm('¿Cerrar todas las pestañas y dejar solo una en blanco?')) {
    return;
  }

  try {
    // Obtener todas las pestañas de la ventana actual
    const tabs = await chrome.tabs.query({ currentWindow: true });
    
    // Crear una nueva pestaña en blanco
    const newTab = await chrome.tabs.create({ url: 'chrome://newtab', active: true });
    
    // Cerrar todas las demás pestañas
    const tabIdsToClose = tabs.map(tab => tab.id).filter(id => id !== newTab.id);
    if (tabIdsToClose.length > 0) {
      await chrome.tabs.remove(tabIdsToClose);
    }
    
    showToast('Pestañas cerradas', 'success');
  } catch (error) {
    showToast('Error al cerrar pestañas', 'error');
  }
}

async function handleSaveMode() {
  const name = elements.modeName.value.trim();
  
  if (!name) {
    showToast('Introduce un nombre para el modo', 'error');
    return;
  }

  let urls = [];
  
  if (editingModeId) {
    // Editando modo existente
    const mode = await Modes.getById(editingModeId);
    urls = mode.urls;
    await Modes.update(editingModeId, {
      name,
      icon: selectedIcon,
      openIn: elements.openIn.value
    });
    showToast('Modo actualizado');
  } else {
    // Creando nuevo modo
    if (elements.saveCurrentTabs.checked) {
      urls = await Modes.getCurrentTabUrls();
      urls = Modes.removeDuplicates(urls);
    }
    
    await Modes.create({
      name,
      icon: selectedIcon,
      urls,
      openIn: elements.openIn.value
    });
    showToast('Modo guardado');
  }

  closeModal(elements.modalMode);
  await loadModes();
  await updateLicenseUI();
}

function handleModesListClick(e) {
  const action = e.target.dataset.action;
  const id = e.target.dataset.id;
  
  if (!action || !id) return;

  switch (action) {
    case 'activate':
      activateMode(id);
      break;
    case 'menu':
      toggleDropdown(id);
      break;
    case 'rename':
      openRenameModal(id);
      break;
    case 'edit-urls':
      openEditUrlsModal(id);
      break;
    case 'delete':
      confirmDeleteMode(id);
      break;
  }
}

async function activateMode(id) {
  try {
    const mode = await Modes.getById(id);
    const settings = await Storage.getSettings();
    
    if (!mode) {
      showToast('Modo no encontrado', 'error');
      return;
    }

    if (mode.urls.length === 0) {
      showToast('Este modo no tiene URLs', 'error');
      return;
    }

    await Activate.activateMode(mode, settings);
    showToast('Modo activado', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function openRenameModal(id) {
  closeAllDropdowns();
  const mode = await Modes.getById(id);
  
  if (!mode) return;

  editingModeId = id;
  elements.modalTitle.textContent = 'Editar Modo';
  elements.modeName.value = mode.name;
  elements.openIn.value = mode.openIn;
  selectIcon(mode.icon || '💼');
  elements.saveCurrentTabs.parentElement.style.display = 'none';
  
  openModal(elements.modalMode);
  elements.modeName.focus();
}

async function openEditUrlsModal(id) {
  closeAllDropdowns();
  const mode = await Modes.getById(id);
  
  if (!mode) return;

  editingModeId = id;
  renderUrlsList(mode.urls);
  openModal(elements.modalUrls);
}

function renderUrlsList(urls) {
  if (urls.length === 0) {
    elements.urlsList.innerHTML = '<p class="empty-state">No hay URLs</p>';
    return;
  }

  elements.urlsList.innerHTML = urls.map((url, index) => `
    <div class="url-item">
      <input type="text" value="${escapeHtml(url)}" data-index="${index}" placeholder="https://...">
      <button class="btn-remove-url" data-index="${index}">&times;</button>
    </div>
  `).join('');

  // Añadir listeners para eliminar URLs
  elements.urlsList.querySelectorAll('.btn-remove-url').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.url-item').remove();
    });
  });
}

function addUrlInput() {
  const emptyState = elements.urlsList.querySelector('.empty-state');
  if (emptyState) {
    emptyState.remove();
  }

  const div = document.createElement('div');
  div.className = 'url-item';
  div.innerHTML = `
    <input type="text" value="" placeholder="https://...">
    <button class="btn-remove-url">&times;</button>
  `;

  div.querySelector('.btn-remove-url').addEventListener('click', () => {
    div.remove();
  });

  elements.urlsList.appendChild(div);
  div.querySelector('input').focus();
}

async function handleSaveUrls() {
  const inputs = elements.urlsList.querySelectorAll('input');
  const urls = Array.from(inputs)
    .map(input => input.value.trim())
    .filter(url => url.length > 0);

  const uniqueUrls = Modes.removeDuplicates(urls);

  await Modes.update(editingModeId, { urls: uniqueUrls });
  
  closeModal(elements.modalUrls);
  await loadModes();
  showToast('URLs actualizadas');
}

async function confirmDeleteMode(id) {
  closeAllDropdowns();
  const mode = await Modes.getById(id);
  
  if (!mode) return;

  if (confirm(`¿Seguro que quieres borrar "${mode.name}"?`)) {
    await Modes.delete(id);
    await loadModes();
    await updateLicenseUI();
    showToast('Modo eliminado');
  }
}

async function handleSaveSettings() {
  const settings = {
    closeOtherTabs: elements.closeOtherTabs.checked
  };

  await Storage.saveSettings(settings);
  closeModal(elements.modalSettings);
  showToast('Ajustes guardados');
}

async function handleActivatePro() {
  const key = elements.licenseKey.value.trim();
  
  const result = await License.activatePro(key);
  
  if (result.success) {
    showToast(result.message, 'success');
    closeModal(elements.modalPro);
    await updateLicenseUI();
  } else {
    showToast(result.message, 'error');
  }
}

// ============================================
// UTILIDADES UI
// ============================================

function openModal(modal) {
  modal.classList.remove('hidden');
}

function closeModal(modal) {
  modal.classList.add('hidden');
  editingModeId = null;
}

function toggleDropdown(id) {
  const allMenus = document.querySelectorAll('.dropdown-menu');
  
  allMenus.forEach(menu => {
    if (menu.dataset.menuId === id) {
      menu.classList.toggle('hidden');
    } else {
      menu.classList.add('hidden');
    }
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.add('hidden');
  });
}

function showToast(message, type = 'default') {
  elements.toast.textContent = message;
  elements.toast.className = `toast ${type}`;
  elements.toast.classList.remove('hidden');

  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 2500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
