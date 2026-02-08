/**
 * Storage module - Gestión del almacenamiento con chrome.storage.local
 */

const Storage = {
  // Estructura de datos por defecto
  defaultData: {
    modes: [],
    settings: {
      closeOtherTabs: false
    },
    license: {
      isPro: false,
      licenseKey: null
    }
  },

  /**
   * Obtiene todos los datos almacenados
   * @returns {Promise<Object>}
   */
  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (result) => {
        // Si no hay datos, devolver estructura por defecto
        if (!result || Object.keys(result).length === 0) {
          resolve({ ...this.defaultData });
        } else {
          // Mezclar con datos por defecto para asegurar estructura completa
          resolve({
            modes: result.modes || [],
            settings: { ...this.defaultData.settings, ...result.settings },
            license: { ...this.defaultData.license, ...result.license }
          });
        }
      });
    });
  },

  /**
   * Guarda todos los datos
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async saveAll(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  },

  /**
   * Obtiene los modos guardados
   * @returns {Promise<Array>}
   */
  async getModes() {
    const data = await this.getAll();
    return data.modes || [];
  },

  /**
   * Guarda los modos
   * @param {Array} modes
   * @returns {Promise<void>}
   */
  async saveModes(modes) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ modes }, resolve);
    });
  },

  /**
   * Obtiene los ajustes
   * @returns {Promise<Object>}
   */
  async getSettings() {
    const data = await this.getAll();
    return data.settings;
  },

  /**
   * Guarda los ajustes
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ settings }, resolve);
    });
  },

  /**
   * Obtiene la información de licencia
   * @returns {Promise<Object>}
   */
  async getLicense() {
    const data = await this.getAll();
    return data.license;
  },

  /**
   * Guarda la información de licencia
   * @param {Object} license
   * @returns {Promise<void>}
   */
  async saveLicense(license) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ license }, resolve);
    });
  },

  /**
   * Genera un ID único
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // ============================================
  // TRACKING DE PESTAÑAS ACTIVAS
  // ============================================

  /**
   * Obtiene las pestañas activas de todos los modos
   * @returns {Promise<Object>} - { modeId: [tabId1, tabId2, ...], ... }
   */
  async getActiveTabs() {
    return new Promise((resolve) => {
      chrome.storage.local.get('activeTabs', (result) => {
        resolve(result.activeTabs || {});
      });
    });
  },

  /**
   * Guarda las pestañas activas de un modo
   * @param {string} modeId - ID del modo
   * @param {Array<number>} tabIds - IDs de las pestañas
   * @returns {Promise<void>}
   */
  async setActiveTabsForMode(modeId, tabIds) {
    const activeTabs = await this.getActiveTabs();
    activeTabs[modeId] = tabIds;
    return new Promise((resolve) => {
      chrome.storage.local.set({ activeTabs }, resolve);
    });
  },

  /**
   * Obtiene las pestañas activas de un modo específico
   * @param {string} modeId - ID del modo
   * @returns {Promise<Array<number>>}
   */
  async getActiveTabsForMode(modeId) {
    const activeTabs = await this.getActiveTabs();
    return activeTabs[modeId] || [];
  },

  /**
   * Elimina el tracking de pestañas de un modo
   * @param {string} modeId - ID del modo
   * @returns {Promise<void>}
   */
  async clearActiveTabsForMode(modeId) {
    const activeTabs = await this.getActiveTabs();
    delete activeTabs[modeId];
    return new Promise((resolve) => {
      chrome.storage.local.set({ activeTabs }, resolve);
    });
  },

  /**
   * Limpia pestañas que ya no existen
   * @returns {Promise<void>}
   */
  async cleanupActiveTabs() {
    const activeTabs = await this.getActiveTabs();
    const existingTabs = await new Promise(resolve => {
      chrome.tabs.query({}, tabs => resolve(tabs.map(t => t.id)));
    });
    
    const existingSet = new Set(existingTabs);
    let changed = false;
    
    for (const modeId of Object.keys(activeTabs)) {
      const filtered = activeTabs[modeId].filter(id => existingSet.has(id));
      if (filtered.length !== activeTabs[modeId].length) {
        activeTabs[modeId] = filtered;
        changed = true;
      }
      // Si no quedan pestañas, eliminar el modo del tracking
      if (activeTabs[modeId].length === 0) {
        delete activeTabs[modeId];
        changed = true;
      }
    }
    
    if (changed) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ activeTabs }, resolve);
      });
    }
  }
};
