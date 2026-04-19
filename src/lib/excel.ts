import * as XLSX from 'xlsx';
import { LeaveRequest, Employee } from '../types';
import { format } from 'date-fns';

export const exportToExcel = (leaves: LeaveRequest[], employees: Employee[]) => {
  // Map leaves with employee salary info if available
  const reportData = leaves.map(leave => {
    const employee = employees.find(e => e.id === leave.employeeId);
    return {
      'Employee Name': leave.employeeName,
      'Email': employee?.email || 'N/A',
      'Department': employee?.department || 'N/A',
      'Salary': employee?.salary || 0,
      'Leave Type': leave.type,
      'Start Date': format(new Date(leave.startDate), 'yyyy-MM-dd'),
      'End Date': format(new Date(leave.endDate), 'yyyy-MM-dd'),
      'Status': leave.status,
      'Created At': format(new Date(leave.createdAt), 'yyyy-MM-dd HH:mm'),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(reportData);
  XLSX.utils.book_append_sheet(wb, ws, 'Leaves and Salary');
  
  const fileName = `Company_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
