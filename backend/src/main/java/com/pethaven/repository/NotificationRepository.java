package com.pethaven.repository;

import com.pethaven.entity.NotificationEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {
    List<NotificationEntity> findByPersonIdOrderByCreatedAtDesc(Long personId, Pageable pageable);

    @Query(value = "SELECT create_notification(CAST(:personId AS integer), CAST(:type AS notification_type), :title, :message)", nativeQuery = true)
    Long createNotification(@Param("personId") Long personId,
                            @Param("type") String type,
                            @Param("title") String title,
                            @Param("message") String message);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE notification SET read = true WHERE notification_id = :id AND person_id = :personId", nativeQuery = true)
    int markRead(@Param("id") Long id, @Param("personId") Long personId);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE notification SET read = true WHERE person_id = :personId", nativeQuery = true)
    int markAllRead(@Param("personId") Long personId);
}
