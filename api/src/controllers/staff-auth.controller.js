import StaffAuthService from '../services/staff-auth.service.js';

class StaffAuthController {
  async login(req, res) {
    try {
      const { email, password, tenant_id } = req.validatedBody;
      const result = await StaffAuthService.login(email, password, tenant_id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Staff login error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process login',
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email, tenant_id } = req.validatedBody;
      const result = await StaffAuthService.generateResetToken(email, tenant_id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Forgot password error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process request',
      });
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.validatedBody;
      const result = await StaffAuthService.resetPassword(token, new_password);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          error: error.message,
        });
      }
      console.error('Reset password error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reset password',
      });
    }
  }
}

export default new StaffAuthController();
