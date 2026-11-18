const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const pesanGalat = errors.array().map(e => e.msg).join('; ');
    if (
      req.path.startsWith('/api/') ||
      req.xhr ||
      (req.headers.accept && req.headers.accept.includes('application/json'))
    ) {
      return res.status(400).json({
        sukses: false,
        pesan: pesanGalat,
        errors: errors.array()
      });
    }
    if (req.session) {
      req.session.flash = { error: pesanGalat };
    }
    return res.redirect('back');
  }
  return next();
};

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email wajib diisi.'),
  body('password')
    .notEmpty()
    .withMessage('Kata sandi wajib diisi.'),
  handleValidationErrors
];

const nilaiInputValidator = [
  body('nilai')
    .notEmpty()
    .withMessage('Nilai wajib diisi.')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Nilai harus berupa angka pada rentang 0 sampai 100.'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  loginValidator,
  nilaiInputValidator
};
