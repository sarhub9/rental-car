import FeatureRequestService from '../services/feature-request.service.js';

async function submit(req, res) {
  try {
    const data = { ...req.validatedBody };

    // Attach company info if user is authenticated
    if (req.user) {
      data.company_id = req.user.tenantId;
    }

    const request = await FeatureRequestService.submit(data);

    return res.status(201).json({
      success: true,
      data: {
        id: request.id,
        feature_title: request.feature_title,
        status: request.status,
        created_at: request.created_at,
      },
    });
  } catch (error) {
    console.error('Feature request submit error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit feature request',
    });
  }
}

async function listRequests(req, res) {
  try {
    const filters = {
      status: req.query.status || undefined,
      company_id: req.query.company_id || undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
    };

    const requests = await FeatureRequestService.listRequests(filters);
    return res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('List feature requests error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch feature requests',
    });
  }
}

async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'REVIEWING', 'IMPLEMENTED', 'DECLINED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
      });
    }

    const request = await FeatureRequestService.updateStatus(id, status);
    return res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    console.error('Update feature request status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update status',
    });
  }
}

export { submit, listRequests, updateStatus };
