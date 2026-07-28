const statsService = require('../services/statsService');

exports.overview = async (req, res, next) => {
  try { res.json(await statsService.getOverview()); } catch (error) { next(error); }
};

exports.byCompany = async (req, res, next) => {
  try { res.json(await statsService.getByCompany()); } catch (error) { next(error); }
};

exports.byTeacher = async (req, res, next) => {
  try { res.json(await statsService.getByTeacher()); } catch (error) { next(error); }
};

exports.byBatch = async (req, res, next) => {
  try { res.json(await statsService.getByBatch()); } catch (error) { next(error); }
};

exports.reports = async (req, res, next) => {
  try { res.json(await statsService.getReportStats()); } catch (error) { next(error); }
};

exports.scores = async (req, res, next) => {
  try { res.json(await statsService.getScoreSummary()); } catch (error) { next(error); }
};

exports.supervisionRequests = async (req, res, next) => {
  try { res.json(await statsService.getSupervisionRequestStats()); } catch (error) { next(error); }
};
