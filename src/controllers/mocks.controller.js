import * as mocksService from "../services/mocks.service.js";

export const getMockUsers = (req, res, next) => {
  try {
    const payload = mocksService.getMockUsers({ qty: req.query.qty, role: req.query.role });
    res.status(200).json({ status: "success", payload });
  } catch (error) {
    next(error);
  }
};

export const getMockOrders = (req, res, next) => {
  try {
    res.status(200).json({ status: "success", payload: mocksService.getMockOrders({ qty: req.query.qty }) });
  } catch (error) {
    next(error);
  }
};

export const getMockDeliveries = (req, res, next) => {
  try {
    res.status(200).json({ status: "success", payload: mocksService.getMockDeliveries({ qty: req.query.qty }) });
  } catch (error) {
    next(error);
  }
};

export const seedUsers = async (req, res, next) => {
  try {
    const result = await mocksService.seedUsers({ qty: req.query.qty, role: req.query.role });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const generateData = async (req, res, next) => {
  try {
    const result = await mocksService.generateData(req.body);
    res.status(201).json({ status: "success", insertados: result });
  } catch (error) {
    next(error);
  }
};
