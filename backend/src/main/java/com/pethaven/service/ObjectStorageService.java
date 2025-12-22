package com.pethaven.service;

import com.pethaven.config.StorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Service
public class ObjectStorageService {

    private static final Logger log = LoggerFactory.getLogger(ObjectStorageService.class);
    private final S3Client s3Client;
    private final StorageProperties properties;
    private volatile boolean bucketChecked = false;

    public ObjectStorageService(S3Client s3Client, StorageProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    public String uploadAvatar(Long personId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String key = "avatars/" + personId + "/" + UUID.randomUUID() + ext;
        uploadInternal(key, file);
        return key;
    }

    public String uploadAnimalMedia(Long animalId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String key = "animals/" + animalId + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;
        uploadInternal(key, file);
        return key;
    }

    public String uploadReportMedia(Long reportId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String key = "reports/" + reportId + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;
        uploadInternal(key, file);
        return key;
    }

    public String uploadPassport(Long applicationId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String key = "passports/" + applicationId + "/" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;
        uploadInternal(key, file);
        return key;
    }

    public String uploadAgreementTemplate(Long agreementId, byte[] content) {
        String key = "agreements/" + agreementId + "/template.docx";
        uploadBytes(key, content, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        return key;
    }

    public String uploadSignedAgreement(Long agreementId, MultipartFile file) {
        String ext = extension(file.getOriginalFilename());
        String key = "agreements/" + agreementId + "/signed-" + Instant.now().toEpochMilli() + "-" + UUID.randomUUID() + ext;
        uploadInternal(key, file);
        return key;
    }

    private void uploadInternal(String key, MultipartFile file) {
        ensureBucket();
        try {
            String contentType = file.getContentType();
            if (!StringUtils.hasText(contentType)) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        } catch (IOException | SdkException e) {
            log.error("Failed to upload object {}", key, e);
            throw new IllegalStateException("Не удалось загрузить файл в хранилище", e);
        }
    }

    private void uploadBytes(String key, byte[] content, String contentType) {
        ensureBucket();
        try {
            if (!StringUtils.hasText(contentType)) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(key)
                    .contentType(contentType)
                    .build();
            s3Client.putObject(putRequest, RequestBody.fromBytes(content));
        } catch (SdkException e) {
            log.error("Failed to upload object {}", key, e);
            throw new IllegalStateException("Не удалось загрузить файл в хранилище", e);
        }
    }

    private String extension(String filename) {
        String ext = StringUtils.getFilenameExtension(filename);
        return ext != null ? "." + ext : "";
    }

    public StorageFile download(String key) {
        ensureBucket();
        try {
            var obj = s3Client.getObject(builder -> builder.bucket(properties.getBucket()).key(key));
            byte[] bytes = obj.readAllBytes();
            String contentType = obj.response().contentType();
            if (!StringUtils.hasText(contentType)) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }
            return new StorageFile(bytes, contentType);
        } catch (SdkException | IOException e) {
            log.error("Failed to read object {}", key, e);
            throw new IllegalStateException("Не удалось получить файл", e);
        }
    }

    private void ensureBucket() {
        if (bucketChecked) {
            return;
        }
        synchronized (this) {
            if (bucketChecked) {
                return;
            }
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(properties.getBucket()).build());
                bucketChecked = true;
                return;
            } catch (NoSuchBucketException ex) {
                // continue
            } catch (SdkException e) {
                log.warn("Bucket check failed: {}", e.getMessage());
            }
            try {
                s3Client.createBucket(CreateBucketRequest.builder().bucket(properties.getBucket()).build());
                bucketChecked = true;
            } catch (SdkException e) {
                log.error("Unable to create bucket {}", properties.getBucket(), e);
                throw new IllegalStateException("Хранилище недоступно, обратитесь к администратору", e);
            }
        }
    }

    public record StorageFile(byte[] bytes, String contentType) {
    }
}
