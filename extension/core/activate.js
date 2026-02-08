/**
 * Activate module - Activación de modos (abrir pestañas)
 */

const Activate = {
  /**
   * Activa un modo: abre todas sus URLs
   * @param {Object} mode - El modo a activar
   * @param {Object} settings - Ajustes globales
   * @returns {Promise<void>}
   */
  async activateMode(mode, settings = {}) {
    if (!mode || !mode.urls || mode.urls.length === 0) {
      throw new Error('El modo no tiene URLs para abrir');
    }

    const closeOtherTabs = settings.closeOtherTabs || false;

    if (mode.openIn === 'newWindow') {
      // Abrir en nueva ventana
      await this.openInNewWindow(mode.urls);
    } else {
      // Abrir en ventana actual
      await this.openInCurrentWindow(mode.urls, closeOtherTabs);
    }
  },

  /**
   * Abre URLs en la ventana actual
   * @param {Array<string>} urls
   * @param {boolean} closeOthers - Si cerrar las otras pestañas
   * @returns {Promise<void>}
   */
  async openInCurrentWindow(urls, closeOthers = false) {
    return new Promise(async (resolve) => {
      // Obtener la ventana actual
      chrome.windows.getCurrent({ populate: true }, async (currentWindow) => {
        const existingTabIds = currentWindow.tabs.map(tab => tab.id);

        // Crear las nuevas pestañas
        const createPromises = urls.map((url, index) => {
          return new Promise((res) => {
            chrome.tabs.create({
              url: url,
              active: index === 0, // Solo la primera pestaña activa
              windowId: currentWindow.id
            }, res);
          });
        });

        await Promise.all(createPromises);

        // Cerrar pestañas anteriores si está habilitado
        if (closeOthers && existingTabIds.length > 0) {
          chrome.tabs.remove(existingTabIds);
        }

        resolve();
      });
    });
  },

  /**
   * Abre URLs en una nueva ventana
   * @param {Array<string>} urls
   * @returns {Promise<void>}
   */
  async openInNewWindow(urls) {
    return new Promise((resolve) => {
      // Crear nueva ventana con la primera URL
      chrome.windows.create({
        url: urls[0],
        focused: true
      }, async (newWindow) => {
        // Abrir el resto de URLs en la nueva ventana
        if (urls.length > 1) {
          const remainingUrls = urls.slice(1);
          const createPromises = remainingUrls.map(url => {
            return new Promise((res) => {
              chrome.tabs.create({
                url: url,
                windowId: newWindow.id,
                active: false
              }, res);
            });
          });
          await Promise.all(createPromises);
        }
        resolve();
      });
    });
  }
};
