package com.pethaven.service;

import com.pethaven.repository.PostAdoptionReportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PostAdoptionReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(PostAdoptionReminderScheduler.class);
    private final PostAdoptionReportRepository reportRepository;

    public PostAdoptionReminderScheduler(PostAdoptionReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    // Ежедневно в 09:00
    @Scheduled(cron = "0 0 9 * * *")
    public void sendReminders() {
        Integer processed = reportRepository.processPendingReports();
        log.info("Post-adoption reminders processed: {}", processed == null ? 0 : processed);
    }
}
