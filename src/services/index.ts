export { StudentService, type CreateStudentDTO, type UpdateStudentDTO } from "./StudentService";
export { TeacherService, type CreateTeacherDTO, type UpdateTeacherDTO } from "./TeacherService";
export { FeeService, type CreateFeeDTO, type UpdateFeeDTO } from "./FeeService";
export { BatchService, type CreateBatchDTO, type UpdateBatchDTO } from "./BatchService";
export { CourseService, type CreateCourseDTO, type UpdateCourseDTO } from "./CourseService";
export { AttendanceService, type CreateAttendanceDTO, type UpdateAttendanceDTO, type BulkAttendanceDTO } from "./AttendanceService";
export { ExamService, type CreateExamDTO, type UpdateExamDTO, type CreateExamResultDTO, type UpdateExamResultDTO } from "./ExamService";
export { NotificationService, type CreateNotificationDTO, type UpdateNotificationDTO } from "./NotificationService";
export { NotificationSettingsService, type UpdateNotificationSettingsDTO } from "./NotificationSettingsService";
export { CommunicationLogService, type CommunicationLogFilters, type CommunicationLogStats, type CreateCommunicationLogDTO, type CommunicationLog } from "./CommunicationLogService";
export { AutomatedNotificationService, type NotificationResult, type BatchNotificationResult } from "./AutomatedNotificationService";
export { SMSService, type SMSConfig, type SMSProvider, type SMSResponse } from "./SMSProviderService";
export { TaskService, type TaskFilters } from "./TaskService";
export { LeadService, type LeadFilters, type LeadPagination, type LeadListResult } from "./LeadService";

export { db } from "./api";
