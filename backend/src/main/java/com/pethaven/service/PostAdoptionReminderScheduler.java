package com.pethaven.service;

import com.pethaven.entity.PostAdoptionReportEntity;
import com.pethaven.model.enums.NotificationType;
import com.pethaven.model.enums.ReportStatus;
import com.pethaven.repository.PostAdoptionReportReminderProjection;
import com.pethaven.repository.PostAdoptionReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PostAdoptionReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(PostAdoptionReminderScheduler.class);
    private final PostAdoptionReportRepository reportRepository;
    private final NotificationService notificationService;

    public PostAdoptionReminderScheduler(PostAdoptionReportRepository reportRepository,
                                         NotificationService notificationService) {
        this.reportRepository = reportRepository;
        this.notificationService = notificationService;
    }

    // Ежедневно в 09:00
    @Scheduled(cron = "0 0 9 * * *")
    @Transactional
    public void sendReminders() {
        List<PostAdoptionReportReminderProjection> pending = reportRepository.findPendingForReminder();
        if (pending.isEmpty()) {
            log.info("Post-adoption reminders processed: 0");
            return;
        }

        LocalDate today = LocalDate.now();
        OffsetDateTime now = OffsetDateTime.now();
        Map<Long, PostAdoptionReportReminderProjection> metaById = pending.stream()
                .collect(Collectors.toMap(PostAdoptionReportReminderProjection::getId, Function.identity()));

        List<PostAdoptionReportEntity> reports = reportRepository.findAllById(metaById.keySet());
        int notified = 0;
        int updated = 0;

        for (PostAdoptionReportEntity report : reports) {
            PostAdoptionReportReminderProjection meta = metaById.get(report.getId());
            if (meta == null) {
                continue;
            }
            boolean changed = false;

            if (report.getDueDate() != null && report.getDueDate().isBefore(today) && report.getStatus() != ReportStatus.overdue) {
                report.setStatus(ReportStatus.overdue);
                changed = true;
            }

            long daysLeft = report.getDueDate() != null ? ChronoUnit.DAYS.between(today, report.getDueDate()) : Long.MAX_VALUE;
            boolean alreadyRemindedToday = report.getLastRemindedAt() != null && !report.getLastRemindedAt().toLocalDate().isBefore(today);

            if (daysLeft <= 3 && daysLeft >= 0 && !alreadyRemindedToday && meta.getCandidateId() != null) {
                notificationService.push(
                        meta.getCandidateId(),
                        NotificationType.report_due,
                        "Напоминание об отчете",
                        String.format("Отчет по договору #%d. Срок: %s", report.getAgreementId(), report.getDueDate())
                );
                report.setLastRemindedAt(now);
                notified++;
                changed = true;
            }

            if (changed) {
                updated++;
                reportRepository.save(report);
            }
        }

        log.info("Post-adoption reminders processed: {} notifications, {} reports updated", notified, updated);
    }
}
