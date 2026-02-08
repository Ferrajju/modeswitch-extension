/**
 * License module - Pro mode management
 */

const License = {
  // Free version mode limit
  FREE_MODE_LIMIT: 2,

  // Developer master key (bypasses webhook)
  MASTER_KEY: 'BielFerrer',

  // Webhook URL for license validation
  WEBHOOK_URL: 'https://bielferrer.app.n8n.cloud/webhook/91621004-7c67-44f7-b352-6087fec0c2d5',

  /**
   * Check if user is Pro
   * @returns {Promise<boolean>}
   */
  async isPro() {
    const license = await Storage.getLicense();
    return license.isPro === true;
  },

  /**
   * Get mode limit based on license type
   * @returns {Promise<number>}
   */
  async getModeLimit() {
    const isPro = await this.isPro();
    return isPro ? Infinity : this.FREE_MODE_LIMIT;
  },

  /**
   * Check if user can create a new mode
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
        reason: `You've reached the limit of ${this.FREE_MODE_LIMIT} mode(s) in the free version. Upgrade to Pro for unlimited modes.`
      };
    }

    return { canCreate: true };
  },

  /**
   * Verify license key via webhook with device binding
   * @param {string} key - The license key to verify
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async verifyLicenseKey(key) {
    if (!key) {
      return { ok: false, error: 'invalid_key' };
    }

    const cleanKey = key.trim().toUpperCase();

    if (cleanKey.length < 8) {
      return { ok: false, error: 'invalid_key' };
    }

    // Master key bypasses webhook
    if (cleanKey === this.MASTER_KEY.toUpperCase()) {
      return { ok: true, isMaster: true };
    }

    // Get or create device ID
    const deviceId = await Storage.getDeviceId();

    // Call webhook to verify with device binding
    try {
      const response = await fetch(this.WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          key: cleanKey,
          deviceId: deviceId
        })
      });

      const data = await response.json();

      if (response.ok && data.ok === true) {
        return { ok: true };
      } else if (data.error === 'device_mismatch') {
        return { ok: false, error: 'device_mismatch' };
      } else {
        return { ok: false, error: 'invalid_key' };
      }
    } catch (error) {
      return { ok: false, error: 'network_error' };
    }
  },

  /**
   * Activate Pro license
   * @param {string} key - The license key
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  async activatePro(key) {
    const cleanKey = key ? key.trim().toUpperCase() : '';
    
    // Verify the key
    const result = await this.verifyLicenseKey(cleanKey);

    if (result.ok) {
      // Save license to storage
      await Storage.saveLicense({
        isPro: true,
        key: result.isMaster ? '🔑 MASTER KEY' : cleanKey,
        isMaster: result.isMaster || false,
        activatedAt: Date.now()
      });
      return { ok: true };
    }

    return { ok: false, error: result.error };
  },

  /**
   * Reset/deactivate Pro license (for testing)
   * @returns {Promise<void>}
   */
  async resetPro() {
    await Storage.saveLicense({
      isPro: false,
      key: null,
      isMaster: false,
      activatedAt: null
    });
  },

  /**
   * Get license info for display
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
      modesText: license.isPro ? 'Pro active' : `${modesCount}/${limit} modes`
    };
  }
};
