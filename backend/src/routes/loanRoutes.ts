import { Router } from 'express';
import {
  uploadSalarySlipHandler,
  applyLoanHandler,
  getMyLoansHandler,
  getLoanByIdHandler,
  downloadDocumentHandler,
} from '../controllers/loanController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { uploadSalarySlip } from '../middleware/upload';

const router = Router();

router.post(
  '/upload-salary-slip',
  authenticateJWT,
  authorizeRoles('BORROWER', 'ADMIN'),
  uploadSalarySlip.single('salarySlip'),
  uploadSalarySlipHandler
);

router.post('/apply', authenticateJWT, authorizeRoles('BORROWER', 'ADMIN'), applyLoanHandler);
router.get('/my-loans', authenticateJWT, getMyLoansHandler);
router.get('/document/:filename', authenticateJWT, downloadDocumentHandler);
router.get('/:id', authenticateJWT, getLoanByIdHandler);

export default router;
