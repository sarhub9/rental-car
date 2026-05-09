import driverProfileService from '../services/driver-profile.service.js';

export const listDrivers = async (req, res, next) => {
  try {
    const result = await driverProfileService.listDrivers(req.tenantId, req.query);
    res.json(result);
  } catch (err) { next(err); }
};

export const createDriver = async (req, res, next) => {
  try {
    const driver = await driverProfileService.createDriver(req.tenantId, req.body, req.user.id);
    res.status(201).json(driver);
  } catch (err) { next(err); }
};

export const getDriver = async (req, res, next) => {
  try {
    const driver = await driverProfileService.getDriver(req.params.id, req.tenantId);
    res.json(driver);
  } catch (err) { next(err); }
};

export const updateDriver = async (req, res, next) => {
  try {
    const driver = await driverProfileService.updateDriver(req.params.id, req.tenantId, req.body);
    res.json(driver);
  } catch (err) { next(err); }
};

export const searchDrivers = async (req, res, next) => {
  try {
    const drivers = await driverProfileService.searchDrivers(req.tenantId, req.query.q);
    res.json(drivers);
  } catch (err) { next(err); }
};

export const validateDriverDocs = async (req, res, next) => {
  try {
    const driver = await driverProfileService.getDriver(req.params.id, req.tenantId);
    const validation = driverProfileService.validateDriverDocuments(driver);
    res.json({ driver_id: req.params.id, ...validation });
  } catch (err) { next(err); }
};

export const blacklistDriver = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const driver = await driverProfileService.blacklistDriver(req.params.id, req.tenantId, reason);
    res.json(driver);
  } catch (err) { next(err); }
};

export const unblacklistDriver = async (req, res, next) => {
  try {
    const driver = await driverProfileService.unblacklistDriver(req.params.id, req.tenantId);
    res.json(driver);
  } catch (err) { next(err); }
};
