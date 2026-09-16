import fs from 'fs';
import path from 'path';

export function ensureUploadsDirectory(): string {
  // Determine absolute uploads path using process.cwd() and __dirname fallback
  const possiblePaths = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'backend/uploads'),
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../../uploads'),
  ];

  let targetDir = possiblePaths[0];

  // Pick or create directory
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      targetDir = p;
      break;
    }
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create sample_salary_slip.pdf if it doesn't exist
  const samplePdfPath = path.join(targetDir, 'sample_salary_slip.pdf');
  if (!fs.existsSync(samplePdfPath)) {
    const samplePdfRaw = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 174 >>
stream
BT
/F1 24 Tf
50 700 Td
(CreditSea Sample Salary Slip) Tj
0 -40 Td
/F1 14 Tf
(Employee Name: Sample Borrower) Tj
0 -25 Td
(Gross Salary: Rs 85,000) Tj
0 -25 Td
(Deductions: Rs 5,000) Tj
0 -25 Td
(Net Pay: Rs 80,000) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000280 00000 n 
0000000506 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
575
%%EOF`;
    fs.writeFileSync(samplePdfPath, samplePdfRaw.trim());
    console.log(`📄 Created sample_salary_slip.pdf at ${samplePdfPath}`);
  }

  return targetDir;
}
