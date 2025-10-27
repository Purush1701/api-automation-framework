import path from 'node:path';
import fs from 'node:fs';
import XLSX from 'xlsx';
 
/**
* Updates ICBC Excel template cells and returns before/after snapshot.
* @param {Object} args
* @param {string} args.filePath 
* @param {string} args.referenceNumber
* @param {string} args.BeneficiaryAcc
* @param {string} args.BeneficiaryName
* @param {Object} config
*/
export async function updateIcbcExcel(args, config) {
  const { filePath, referenceNumber, BeneficiaryAcc, BeneficiaryName } = args || {};
  const projectRoot = config?.projectRoot || process.cwd();
  const absPath = path.isAbsolute(filePath) ? filePath : path.join(projectRoot, filePath);
 
  if (!fs.existsSync(absPath)) {
    throw new Error(`Excel file not found at: ${absPath}`);
  }
 
  const wb = XLSX.readFile(absPath);
  const ws = wb.Sheets[wb.SheetNames[0]];
 
  const get = (addr) => (ws[addr] ? ws[addr].v : undefined);
  const set = (addr, v) => {
    ws[addr] = { t: 's', v: String(v ?? '') };
  };
 
  const before = { F9: get('F9'), K9: get('K9'), L9: get('L9') };
 
  set('F9', referenceNumber);
  set('K9', BeneficiaryAcc);
  set('L9', BeneficiaryName);
 
  XLSX.writeFile(wb, absPath);
 
  const wbAfter = XLSX.readFile(absPath);
  const wsAfter = wbAfter.Sheets[wbAfter.SheetNames[0]];
  const after = {
    F9: wsAfter['F9']?.v,
    K9: wsAfter['K9']?.v,
    L9: wsAfter['L9']?.v,
  };

  return { before, after, path: filePath };
}