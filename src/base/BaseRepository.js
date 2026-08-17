/**
 * BaseRepository providing generic data access and tenant scoping patterns.
 */
export class BaseRepository {
  /**
   * @param {Object} model - Sequelize Model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Returns a tenant-scoped query wrapper or model helper
   * @param {string} tenantId
   * @returns {Object} Scoped model operations
   */
  withTenant(tenantId) {
    if (!tenantId) {
      throw new Error("Tenant ID is required for tenant-scoped operations");
    }
    return {
      findAndCountAll: (options = {}) =>
        this.model.findAndCountAll({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      findAll: (options = {}) =>
        this.model.findAll({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      findOne: (options = {}) =>
        this.model.findOne({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      findByPk: (id, options = {}) =>
        this.model.findOne({
          ...options,
          where: { ...(options.where || {}), id, tenantId },
        }),
      create: (data, options = {}) =>
        this.model.create({ ...data, tenantId }, options),
      bulkCreate: (records, options = {}) => {
        const tenantRecords = records.map((r) => ({ ...r, tenantId }));
        return this.model.bulkCreate(tenantRecords, options);
      },
      update: (data, options = {}) =>
        this.model.update(data, {
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
      destroy: (options = {}) =>
        this.model.destroy({
          ...options,
          where: { ...(options.where || {}), tenantId },
        }),
    };
  }

  async findById(tenantId, id, options = {}) {
    return this.withTenant(tenantId).findByPk(id, options);
  }

  async findAll(tenantId, options = {}) {
    return this.withTenant(tenantId).findAll(options);
  }

  async create(tenantId, data, options = {}) {
    return this.withTenant(tenantId).create(data, options);
  }

  async update(tenantId, where, data, options = {}) {
    return this.model.update(data, {
      ...options,
      where: { ...where, tenantId },
    });
  }

  async delete(tenantId, where, options = {}) {
    return this.model.destroy({
      ...options,
      where: { ...where, tenantId },
    });
  }
}
