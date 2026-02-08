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
   * Obtiene las URLs de las pestañas actuales (todas las ventanas)
   * @returns {Promise<Array<string>>}
   */
  async getCurrentTabUrls() {
    return new Promise((resolve) => {
      chrome.tabs.query({ windowType: 'normal' }, (tabs) => {
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
   * Extrae el dominio base de una URL
   * @param {string} url
   * @returns {string|null}
   */
  getDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return null;
    }
  },

  /**
   * Compara si dos URLs son del mismo dominio
   * @param {string} url1
   * @param {string} url2
   * @returns {boolean}
   */
  isSameDomain(url1, url2) {
    const domain1 = this.getDomain(url1);
    const domain2 = this.getDomain(url2);
    
    if (!domain1 || !domain2) return false;
    
    // Comparar dominios (ignorando www)
    const clean1 = domain1.replace(/^www\./, '');
    const clean2 = domain2.replace(/^www\./, '');
    
    return clean1 === clean2;
  },

  /**
   * Verifica si una URL de pestaña coincide con una URL de modo
   * Compara por dominio para permitir navegación interna
   * @param {string} tabUrl - URL actual de la pestaña
   * @param {string} modeUrl - URL guardada en el modo
   * @returns {boolean}
   */
  urlMatches(tabUrl, modeUrl) {
    // Primero intentar coincidencia exacta o por prefijo
    if (tabUrl === modeUrl || tabUrl.startsWith(modeUrl) || modeUrl.startsWith(tabUrl)) {
      return true;
    }
    
    // Si no hay coincidencia exacta, comparar por dominio
    return this.isSameDomain(tabUrl, modeUrl);
  },

  /**
   * Comparación estricta: solo coincide si es la misma URL o prefijo
   * NO compara por dominio - usado para protección al cerrar modos
   * @param {string} tabUrl - URL actual de la pestaña
   * @param {string} modeUrl - URL guardada en el modo
   * @returns {boolean}
   */
  urlMatchesStrict(tabUrl, modeUrl) {
    if (!tabUrl || !modeUrl) return false;
    
    // Solo coincidencia exacta o por prefijo, NO por dominio
    return tabUrl === modeUrl || tabUrl.startsWith(modeUrl) || modeUrl.startsWith(tabUrl);
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
