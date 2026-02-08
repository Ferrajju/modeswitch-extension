/**
 * Popup UI - Controlador principal de la interfaz
 */

// Estado de la aplicación
let currentModes = [];
let currentTabUrls = [];
let activeTabsByMode = {}; // { modeId: [tabId1, tabId2, ...] }
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
  
  // Modal selección crear modo
  modalCreateChoice: document.getElementById('modal-create-choice'),
  btnCloseChoice: document.getElementById('btn-close-choice'),
  btnCaptureTabs: document.getElementById('btn-capture-tabs'),
  btnManualAdd: document.getElementById('btn-manual-add'),
  
  // Toast
  toast: document.getElementById('toast')
};

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', init);

async function init() {
  await Storage.cleanupActiveTabs(); // Limpiar pestañas que ya no existen
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
  currentTabUrls = await Modes.getCurrentTabUrls();
  activeTabsByMode = await Storage.getActiveTabs();
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
// HELPERS
// ============================================

/**
 * Verifica si un modo está activo (tiene pestañas trackeadas abiertas)
 * @param {Object} mode - El modo a verificar
 * @returns {boolean}
 */
function isModeActive(mode) {
  const trackedTabs = activeTabsByMode[mode.id] || [];
  return trackedTabs.length > 0;
}

/**
 * Obtiene los modos que están activos
 * Un modo está activo si tiene pestañas trackeadas
 * @returns {Array} - Array de modos activos
 */
function getTrulyActiveModes() {
  return currentModes.filter(mode => isModeActive(mode));
}

// ============================================
// RENDERIZADO
// ============================================

function renderModes() {
  if (currentModes.length === 0) {
    elements.modesList.innerHTML = '<p class="empty-state">No tienes modos guardados</p>';
    return;
  }

  // Usar el helper para obtener modos realmente activos
  const trulyActiveModes = getTrulyActiveModes();
  const activeModesIds = new Set(trulyActiveModes.map(m => m.id));

  elements.modesList.innerHTML = currentModes.map(mode => {
    const isActive = activeModesIds.has(mode.id);
    
    return `
    <div class="mode-item ${isActive ? 'mode-active' : ''}" data-id="${mode.id}">
      <div class="mode-info">
        <span class="mode-icon">${mode.icon || '💼'}</span>
        <div class="mode-details">
          <span class="mode-name">${escapeHtml(mode.name)}</span>
          <span class="mode-urls-count">${mode.urls.length} pestaña${mode.urls.length !== 1 ? 's' : ''}${isActive ? ' • Activo' : ''}</span>
        </div>
      </div>
      <div class="mode-actions">
        <div class="btn-group">
          ${isActive 
            ? `<button class="btn-deactivate" data-action="deactivate" data-id="${mode.id}">Cerrar</button>`
            : `<button class="btn-activate" data-action="activate" data-id="${mode.id}">Activar</button>
               <button class="btn-new-window" data-action="activate-alternate" data-id="${mode.id}" title="Abrir de forma alternativa">+</button>`
          }
        </div>
        <div class="dropdown">
          <button class="btn-menu" data-action="menu" data-id="${mode.id}">⋮</button>
          <div class="dropdown-menu hidden" data-menu-id="${mode.id}">
            <div class="dropdown-toggle" data-action="toggle-new-window" data-id="${mode.id}">
              <span>Nueva ventana</span>
              <span class="toggle-switch ${mode.openIn === 'newWindow' ? 'active' : ''}" data-id="${mode.id}"></span>
            </div>
            <div class="dropdown-divider"></div>
            ${isActive ? `<button class="dropdown-item danger" data-action="deactivate" data-id="${mode.id}">Cerrar pestañas</button>` : ''}
            <button class="dropdown-item" data-action="recapture" data-id="${mode.id}">Recapturar</button>
            <button class="dropdown-item" data-action="rename" data-id="${mode.id}">Renombrar</button>
            <button class="dropdown-item" data-action="edit-urls" data-id="${mode.id}">Editar URLs</button>
            <button class="dropdown-item danger" data-action="delete" data-id="${mode.id}">Borrar</button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');
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
  
  // Modal selección crear modo
  elements.btnCloseChoice.addEventListener('click', () => closeModal(elements.modalCreateChoice));
  elements.modalCreateChoice.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.modalCreateChoice));
  elements.btnCaptureTabs.addEventListener('click', handleCaptureTabs);
  elements.btnManualAdd.addEventListener('click', handleManualAdd);
  
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

  // Abrir modal de selección
  openModal(elements.modalCreateChoice);
}

async function handleCaptureTabs() {
  closeModal(elements.modalCreateChoice);
  
  // Abrir modal para crear modo con captura de pestañas
  editingModeId = null;
  elements.modalTitle.textContent = 'Crear Modo';
  elements.modeName.value = '';
  elements.saveCurrentTabs.checked = true;
  elements.saveCurrentTabs.parentElement.style.display = 'none'; // Ocultar checkbox, ya decidió capturar
  elements.openIn.value = 'currentWindow';
  selectIcon('💼');
  openModal(elements.modalMode);
  elements.modeName.focus();
}

async function handleManualAdd() {
  closeModal(elements.modalCreateChoice);
  
  // Abrir modal para crear modo sin captura
  editingModeId = null;
  elements.modalTitle.textContent = 'Crear Modo';
  elements.modeName.value = '';
  elements.saveCurrentTabs.checked = false;
  elements.saveCurrentTabs.parentElement.style.display = 'none'; // Ocultar checkbox, ya decidió manual
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

async function getUrlsExcludingActiveModes() {
  // Obtener todas las pestañas actuales
  const allTabs = await new Promise(resolve => {
    chrome.tabs.query({ windowType: 'normal' }, resolve);
  });
  
  // Obtener IDs de pestañas que pertenecen a modos activos
  const activeTabIds = new Set();
  for (const modeId of Object.keys(activeTabsByMode)) {
    for (const tabId of activeTabsByMode[modeId]) {
      activeTabIds.add(tabId);
    }
  }
  
  // Filtrar: solo incluir pestañas que NO están trackeadas por ningún modo
  const filteredUrls = allTabs
    .filter(tab => !activeTabIds.has(tab.id))
    .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
    .map(tab => tab.url);
  
  return Modes.removeDuplicates(filteredUrls);
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
      // Capturar URLs excluyendo las de modos activos
      urls = await getUrlsExcludingActiveModes();
      
      if (urls.length === 0) {
        showToast('No hay pestañas nuevas para capturar (todas pertenecen a modos activos)', 'error');
        return;
      }
    }
    
    await Modes.create({
      name,
      icon: selectedIcon,
      urls,
      openIn: elements.openIn.value
    });
    showToast(`Modo guardado (${urls.length} pestañas)`);
  }

  closeModal(elements.modalMode);
  await loadModes();
  await updateLicenseUI();
}

function handleModesListClick(e) {
  // Buscar el elemento con data-action más cercano (puede ser el target o un padre)
  const actionElement = e.target.closest('[data-action]');
  if (!actionElement) return;
  
  const action = actionElement.dataset.action;
  const id = actionElement.dataset.id;
  
  if (!action || !id) return;

  switch (action) {
    case 'activate':
      activateMode(id, false);
      break;
    case 'activate-alternate':
      activateModeAlternate(id);
      break;
    case 'deactivate':
      deactivateMode(id);
      break;
    case 'menu':
      toggleDropdown(id);
      break;
    case 'toggle-new-window':
      toggleNewWindowOption(id);
      break;
    case 'recapture':
      handleRecaptureTabs(id);
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

async function handleRecaptureTabs(id) {
  closeAllDropdowns();
  const mode = await Modes.getById(id);
  
  if (!mode) return;

  // Obtener todas las pestañas actuales
  const allTabs = await new Promise(resolve => {
    chrome.tabs.query({ windowType: 'normal' }, resolve);
  });
  
  // Obtener IDs de pestañas que pertenecen a OTROS modos activos
  const otherActiveTabIds = new Set();
  for (const modeId of Object.keys(activeTabsByMode)) {
    if (modeId !== id) { // Excluir el modo actual
      for (const tabId of activeTabsByMode[modeId]) {
        otherActiveTabIds.add(tabId);
      }
    }
  }
  
  // Filtrar: pestañas que NO pertenecen a otros modos activos
  const availableTabs = allTabs
    .filter(tab => !otherActiveTabIds.has(tab.id))
    .filter(tab => tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'));
  
  const uniqueUrls = Modes.removeDuplicates(availableTabs.map(t => t.url));
  
  if (uniqueUrls.length === 0) {
    showToast('No hay pestañas para capturar', 'error');
    return;
  }

  const confirmed = confirm(
    `¿Reemplazar las ${mode.urls.length} pestañas guardadas en "${mode.name}" por ${uniqueUrls.length} pestañas?`
  );

  if (confirmed) {
    await Modes.update(id, { urls: uniqueUrls });
    await loadModes();
    showToast(`Pestañas recapturadas (${uniqueUrls.length})`, 'success');
  }
}

async function activateMode(id, forceNewWindow = false) {
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

    // Si forceNewWindow es true, sobreescribir la configuración del modo
    const modeToActivate = forceNewWindow 
      ? { ...mode, openIn: 'newWindow' } 
      : mode;

    // Activar y guardar los IDs de las pestañas creadas
    const createdTabIds = await Activate.activateMode(modeToActivate, settings);
    await Storage.setActiveTabsForMode(id, createdTabIds);
    
    await loadModes(); // Recargar para actualizar el estado
    showToast('Modo activado', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function activateModeAlternate(id) {
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

    // Hacer lo opuesto a la configuración del modo
    const alternateOpenIn = mode.openIn === 'newWindow' ? 'currentWindow' : 'newWindow';
    const modeToActivate = { ...mode, openIn: alternateOpenIn };

    // El botón "+" nunca cierra pestañas existentes
    const settingsOverride = { ...settings, closeOtherTabs: false };

    // Activar y guardar los IDs de las pestañas creadas
    const createdTabIds = await Activate.activateMode(modeToActivate, settingsOverride);
    
    // Añadir a las pestañas existentes del modo (no reemplazar)
    const existingTabs = activeTabsByMode[id] || [];
    await Storage.setActiveTabsForMode(id, [...existingTabs, ...createdTabIds]);
    
    await loadModes(); // Recargar para actualizar el estado
    showToast('Modo activado', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function deactivateMode(id) {
  closeAllDropdowns();
  
  try {
    // Obtener las pestañas trackeadas de este modo
    const trackedTabIds = activeTabsByMode[id] || [];
    
    if (trackedTabIds.length === 0) {
      showToast('Este modo no tiene pestañas activas', 'error');
      return;
    }

    // Obtener todas las pestañas actuales para verificar cuáles existen
    const allTabs = await new Promise(resolve => {
      chrome.tabs.query({ windowType: 'normal' }, resolve);
    });
    
    const existingTabIds = new Set(allTabs.map(t => t.id));
    
    // Filtrar solo las pestañas que aún existen
    const tabsToClose = trackedTabIds.filter(id => existingTabIds.has(id));
    
    if (tabsToClose.length === 0) {
      // Limpiar tracking y actualizar
      await Storage.clearActiveTabsForMode(id);
      await loadModes();
      showToast('Las pestañas ya fueron cerradas', 'error');
      return;
    }

    // Agrupar por ventana para verificar si alguna quedará vacía
    const tabsByWindow = {};
    allTabs.forEach(tab => {
      if (!tabsByWindow[tab.windowId]) tabsByWindow[tab.windowId] = [];
      tabsByWindow[tab.windowId].push(tab);
    });

    const tabsToCloseByWindow = {};
    for (const tabId of tabsToClose) {
      const tab = allTabs.find(t => t.id === tabId);
      if (tab) {
        if (!tabsToCloseByWindow[tab.windowId]) tabsToCloseByWindow[tab.windowId] = [];
        tabsToCloseByWindow[tab.windowId].push(tab);
      }
    }

    // Si alguna ventana quedará vacía, crear una pestaña nueva
    for (const windowId of Object.keys(tabsToCloseByWindow)) {
      const totalInWindow = tabsByWindow[windowId]?.length || 0;
      const toCloseInWindow = tabsToCloseByWindow[windowId]?.length || 0;
      
      if (totalInWindow === toCloseInWindow) {
        await new Promise(resolve => {
          chrome.tabs.create({ url: 'chrome://newtab', windowId: parseInt(windowId) }, resolve);
        });
      }
    }

    // Cerrar las pestañas trackeadas
    await new Promise(resolve => {
      chrome.tabs.remove(tabsToClose, resolve);
    });

    // Limpiar el tracking de este modo
    await Storage.clearActiveTabsForMode(id);

    showToast(`${tabsToClose.length} pestaña${tabsToClose.length !== 1 ? 's' : ''} cerrada${tabsToClose.length !== 1 ? 's' : ''}`, 'success');
    await loadModes();
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function toggleNewWindowOption(id) {
  const mode = await Modes.getById(id);
  if (!mode) return;

  const newOpenIn = mode.openIn === 'newWindow' ? 'currentWindow' : 'newWindow';
  await Modes.update(id, { openIn: newOpenIn });
  
  // Actualizar el toggle visualmente
  const toggle = document.querySelector(`.toggle-switch[data-id="${id}"]`);
  if (toggle) {
    toggle.classList.toggle('active', newOpenIn === 'newWindow');
  }
  
  showToast(newOpenIn === 'newWindow' ? 'Abrirá en nueva ventana' : 'Abrirá en ventana actual');
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
