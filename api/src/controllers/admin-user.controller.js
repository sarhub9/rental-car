import AdminUserService from '../services/admin-user.service.js';

class AdminUserController {
  async list(req, res) {
    try {
      const filters = {
        role: req.query.role || undefined,
        status: req.query.status || undefined,
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
        offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
      };

      const users = await AdminUserService.listUsers(req.tenantId, filters);

      return res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      console.error('List users error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to list users',
      });
    }
  }

  async create(req, res) {
    try {
      const user = await AdminUserService.createUser(req.tenantId, req.validatedBody);

      return res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Create user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create user',
      });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const users = await AdminUserService.listUsers(req.tenantId, {});
      const user = users.find((u) => u.id === id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...safeUser } = user;
      return res.status(200).json({
        success: true,
        data: safeUser,
      });
    } catch (error) {
      console.error('Get user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get user',
      });
    }
  }

  async update(req, res) {
    try {
      const user = await AdminUserService.updateUser(req.params.id, req.tenantId, req.validatedBody);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Update user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update user',
      });
    }
  }

  async deactivate(req, res) {
    try {
      const result = await AdminUserService.deactivateUser(req.params.id, req.tenantId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Deactivate user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to deactivate user',
      });
    }
  }

  async activate(req, res) {
    try {
      const result = await AdminUserService.activateUser(req.params.id, req.tenantId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Activate user error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to activate user',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const result = await AdminUserService.triggerPasswordReset(req.params.id, req.tenantId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Reset password error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to trigger password reset',
      });
    }
  }
}

export default new AdminUserController();
