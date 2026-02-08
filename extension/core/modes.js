/**
 * Modes module - CRUD de modos
 */

const Modes = {
  /**
   * Obtiene todos los modos
   * @returns {Promise<Array>}
   */
  async getAll() {
    return await Storage.getModes();
  },

  /**
   * Obtiene un modo por ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const modes = await this.getAll();
    return modes.find(m => m.id === id) || null;
  },

  /**
   * Crea un nuevo modo
   * @param {Object} modeData - { name, icon, urls, openIn }
   * @returns {Promise<Object>} - El modo creado
   */
  async create(modeData) {
    const modes = await this.getAll();
    
    const newMode = {
      id: Storage.generateId(),
      name: modeData.name.trim(),
      icon: modeData.icon || '💼',
      urls: modeData.urls || [],
      openIn: modeData.openIn || 'currentWindow',
      createdAt: Date.now()
    };

    modes.push(newMode);
    await Storage.saveModes(modes);
    
    return newMode;
  },

  /**
   * Actualiza un modo existente
   * @param {string} id
   * @param {Object} updates - Campos a actualizar
   * @returns {Promise<Object|null>}
   */
  async update(id, updates) {
    const modes = await this.getAll();
    const index = modes.findIndex(m => m.id === id);
    
    if (index === -1) return null;

    // Actualizar solo los campos proporcionados
    if (updates.name !== undefined) {
      modes[index].name = updates.name.trim();
    }
    if (updates.icon !== undefined) {
      modes[index].icon = updates.icon;
    }
    if (updates.urls !== undefined) {
      modes[index].urls = updates.urls;
    }
    if (updates.openIn !== undefined) {
      modes[index].openIn = updates.openIn;
    }

    modes[index].updatedAt = Date.now();
    await Storage.saveModes(modes);
    
    return modes[index];
  },

  /**
   * Renombra un modo
   * @param {string} id
   * @param {string} newName
   * @returns {Promise<Object|null>}
   */
  async rename(id, newName) {
    return await this.update(id, { name: newName });
  },

  /**
   * Elimina un modo
   * @param {string} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const modes = await this.getAll();
    const filteredModes = modes.filter(m => m.id !== id);
    
    if (filteredModes.length === modes.length) {
      return false; // No se encontró el modo
    }

    await Storage.saveModes(filteredModes);
    return true;
  },

  /**
   * Obtiene las URLs de las pestañas actuales
   * @returns {Promise<Array<string>>}
   */
  async getCurrentTabUrls() {
    return new Promise((resolve) => {
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const urls = tabs
          .map(tab => tab.url)
          .filter(url => url && !url.startsWith('chrome://') && !url.startsWith('chrome-extension://'));
        resolve(urls);
      });
    });
  },

  /**
   * Elimina URLs duplicadas de un array
   * @param {Array<string>} urls
   * @returns {Array<string>}
   */
  removeDuplicates(urls) {
    return [...new Set(urls)];
  },

  /**
   * Cuenta el número de modos
   * @returns {Promise<number>}
   */
  async count() {
    const modes = await this.getAll();
    return modes.length;
  }
};
