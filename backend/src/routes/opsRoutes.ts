import { Router } from 'express';
import {
  getSalesLeads,
  getSanctionLoans,
  processSanctionDecision,
  getDisbursementLoans,
  disburseLoan,
  getCollectionLoans,
  recordPayment,
  getLoanPayments,
} from '../controllers/opsController';
import { authenticateJWT, authorizeRoles } from '../middleware/auth';

const router = Router();

// Sales module routes (Allowed: SALES, ADMIN)
router.get('/sales/leads', authenticateJWT, authorizeRoles('SALES', 'ADMIN'), getSalesLeads);

// Sanction module routes (Allowed: SANCTION, ADMIN)
router.get('/sanction/loans', authenticateJWT, authorizeRoles('SANCTION', 'ADMIN'), getSanctionLoans);
router.post('/sanction/loans/:id/decision', authenticateJWT, authorizeRoles('SANCTION', 'ADMIN'), processSanctionDecision);

// Disbursement module routes (Allowed: DISBURSEMENT, ADMIN)
router.get('/disbursement/loans', authenticateJWT, authorizeRoles('DISBURSEMENT', 'ADMIN'), getDisbursementLoans);
router.post('/disbursement/loans/:id/disburse', authenticateJWT, authorizeRoles('DISBURSEMENT', 'ADMIN'), disburseLoan);

// Collection module routes (Allowed: COLLECTION, ADMIN)
router.get('/collection/loans', authenticateJWT, authorizeRoles('COLLECTION', 'ADMIN'), getCollectionLoans);
router.post('/collection/payments', authenticateJWT, authorizeRoles('COLLECTION', 'ADMIN'), recordPayment);
router.get('/collection/loans/:loanId/payments', authenticateJWT, authorizeRoles('COLLECTION', 'ADMIN', 'BORROWER'), getLoanPayments);

export default router;
