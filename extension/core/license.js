/**
 * License module - Gestión del modo Pro
 */

const License = {
  // Límite de modos en versión gratuita
  FREE_MODE_LIMIT: 2,

  /**
   * Verifica si el usuario es Pro
   * @returns {Promise<boolean>}
   */
  async isPro() {
    const license = await Storage.getLicense();
    return license.isPro === true;
  },

  /**
   * Obtiene el límite de modos según el tipo de licencia
   * @returns {Promise<number>}
   */
  async getModeLimit() {
    const isPro = await this.isPro();
    return isPro ? Infinity : this.FREE_MODE_LIMIT;
  },

  /**
   * Verifica si se puede crear un nuevo modo
   * @returns {Promise<{canCreate: boolean, reason?: string}>}
   */
  async canCreateMode() {
    const isPro = await this.isPro();
    if (isPro) {
      return { canCreate: true };
    }

    const currentCount = await Modes.count();
    if (currentCount >= this.FREE_MODE_LIMIT) {
      return {
        canCreate: false,
        reason: `Has alcanzado el límite de ${this.FREE_MODE_LIMIT} modo(s) en la versión gratuita. Activa Pro para modos ilimitados.`
      };
    }

    return { canCreate: true };
  },

  // Clave maestra del desarrollador
  MASTER_KEY: 'BielFerrer',

  /**
   * Activa la licencia Pro
   * @param {string} licenseKey
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async activatePro(licenseKey) {
    // Validación básica de la clave
    if (!licenseKey || licenseKey.trim().length < 8) {
      return {
        success: false,
        message: 'La clave de licencia no es válida'
      };
    }

    const cleanKey = licenseKey.trim();
    
    // Clave maestra del desarrollador - Pro permanente
    const isMasterKey = cleanKey === this.MASTER_KEY;

    await Storage.saveLicense({
      isPro: true,
      licenseKey: isMasterKey ? '🔑 MASTER KEY' : cleanKey.toUpperCase(),
      isMaster: isMasterKey,
      activatedAt: Date.now()
    });

    return {
      success: true,
      message: isMasterKey ? '👑 ¡Bienvenido, Biel! Pro activado para siempre.' : '¡Pro activado correctamente!'
    };
  },

  /**
   * Desactiva la licencia Pro
   * @returns {Promise<void>}
   */
  async deactivatePro() {
    await Storage.saveLicense({
      isPro: false,
      licenseKey: null
    });
  },

  /**
   * Obtiene información de la licencia para mostrar
   * @returns {Promise<Object>}
   */
  async getLicenseInfo() {
    const license = await Storage.getLicense();
    const modesCount = await Modes.count();
    const limit = await this.getModeLimit();

    return {
      isPro: license.isPro,
      modesCount,
      modesLimit: limit,
      modesText: license.isPro ? 'Pro activo' : `${modesCount}/${limit} modos`
    };
  }
};
