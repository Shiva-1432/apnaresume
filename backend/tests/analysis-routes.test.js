const express = require('express');
const request = require('supertest');

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { user_id: 'user-1' };
    next();
  }
}));

jest.mock('../middleware/featureQuota', () => ({
  createFeatureQuota: () => (_req, _res, next) => next()
}));

jest.mock('../middleware/creditCheck', () => ({
  checkCredits: () => (_req, _res, next) => next()
}));

jest.mock('../middleware/validation', () => ({
  validateResumeUpload: (_req, _res, next) => next(),
  handleValidationErrors: (_req, _res, next) => next()
}));

jest.mock('../utils/ai', () => ({
  getGeminiModel: jest.fn(),
  generateContentWithRetry: jest.fn()
}));

jest.mock('../models/Resume', () => ({
  find: jest.fn(),
  findOne: jest.fn()
}));

jest.mock('../models/AnalysisResult', () => ({
  findOne: jest.fn()
}));

jest.mock('../models/JobApplication', () => ({
  find: jest.fn()
}));

const Resume = require('../models/Resume');
const AnalysisResult = require('../models/AnalysisResult');
const JobApplication = require('../models/JobApplication');
const analysisRouter = require('../routes/analysis');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/analysis', analysisRouter);
  return app;
}

describe('Analysis resume lifecycle routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  test('GET /api/analysis/user-resumes excludes deleted resumes and decorates stats', async () => {
    const sortedResumes = [
      {
        _id: 'resume-1',
        toObject: () => ({ _id: 'resume-1', file_name: 'Resume 1', is_deleted: false })
      }
    ];

    const findResult = {
      sort: jest.fn().mockResolvedValue(sortedResumes)
    };

    Resume.find.mockReturnValue(findResult);
    JobApplication.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { resume_used: 'resume-1', status: 'offer' }
      ])
    });

    const response = await request(app).get('/api/analysis/user-resumes');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.resumes).toHaveLength(1);
    expect(response.body.resumes[0]).toMatchObject({
      _id: 'resume-1',
      file_name: 'Resume 1',
      applications_count: 1,
      shortlist_count: 1
    });
  });

  test('GET /api/analysis/resume/:id returns resume and analysis', async () => {
    Resume.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      user_id: 'user-1',
      file_name: 'Resume 1'
    });
    AnalysisResult.findOne.mockResolvedValue({
      ats_score: 84,
      score_breakdown: { format: 80, keywords: 84, experience: 82, education: 90 },
      strengths: ['Strong skills'],
      weaknesses: ['Missing metrics'],
      suggestions: ['Add more outcomes']
    });

    const response = await request(app).get('/api/analysis/resume/507f1f77bcf86cd799439011');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.resume.file_name).toBe('Resume 1');
    expect(response.body.analysis.ats_score).toBe(84);
  });

  test('DELETE /api/analysis/resume/:id soft-deletes the resume', async () => {
    const save = jest.fn();
    Resume.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439012',
      user_id: 'user-1',
      is_deleted: false,
      deleted_at: null,
      updated_at: null,
      save
    });

    const response = await request(app).delete('/api/analysis/resume/507f1f77bcf86cd799439012');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(Resume.findOne).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439012',
      user_id: 'user-1',
      is_deleted: { $ne: true }
    });
  });

  test('POST /api/analysis/resume/:id/restore restores a deleted resume', async () => {
    const save = jest.fn();
    Resume.findOne.mockResolvedValue({
      _id: '507f1f77bcf86cd799439013',
      user_id: 'user-1',
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date(),
      save
    });

    const response = await request(app).post('/api/analysis/resume/507f1f77bcf86cd799439013/restore'); // pragma: allowlist secret

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(save).toHaveBeenCalledTimes(1);
    expect(Resume.findOne).toHaveBeenCalledWith({
      _id: '507f1f77bcf86cd799439013', // pragma: allowlist secret
      user_id: 'user-1',
      is_deleted: true
    });
  });

  test('GET /api/analysis/trash returns deleted resumes only', async () => {
    Resume.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'trash-1', file_name: 'Old Resume', is_deleted: true }
      ])
    });

    const response = await request(app).get('/api/analysis/trash');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.resumes).toHaveLength(1);
    expect(response.body.resumes[0].is_deleted).toBe(true);
  });
});