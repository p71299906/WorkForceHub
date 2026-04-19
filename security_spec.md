# Security Specification - CEO Dashboard & Employee Portal

## Data Invariants
1. A user cannot set their own role during registration (must default to Employee or be set by admin).
2. Users can only clock in/out for themselves.
3. Users cannot approve their own leave requests.
4. Salary information is only readable by the owner and the CEO.
5. Task assignee cannot change the task description or manager.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Role Escalation**: `{ email: "attacker@co.com", role: "CEO" }` by a non-admin.
2. **Salary Theft**: Read `/employees/victimId` by another employee.
3. **Leave Self-Approval**: `{ status: "approved" }` update to a leave request by the requester.
4. **Attendance Spoofing**: `{ employeeId: "victimId", type: "clock_in" }` by another user.
5. **Ghost Task Assignment**: `{ assigneeId: "victimId", managerId: "attackerId" }` by a non-manager.
6. **Announcement Deletion**: `delete /announcements/annId` by an employee.
7. **Identity Hijack**: `{ id: "victimId" }` in the employee creation payload.
8. **Negative Salary**: `{ salary: -1000 }` update.
9. **Future Clock-In**: `{ timestamp: "2050-01-01T00:00:00Z" }` (not strictly blocked by request.time, but good to check).
10. **Shadow Field Injection**: `{ isAdmin: true, extraKey: "payload" }` during profile update.
11. **Manager Impersonation**: `{ managerName: "CEO Boss" }` in task creation by a regular employee.
12. **Public PII Access**: Listing all employees and seeing their `salary`.

## The Validation Patterns
All rules will use `isValid[Entity]` helpers and `affectedKeys().hasOnly()` gates.
