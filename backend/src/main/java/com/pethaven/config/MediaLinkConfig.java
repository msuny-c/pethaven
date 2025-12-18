package com.pethaven.config;

import com.pethaven.support.MediaLinkSupport;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({MediaProperties.class, StorageProperties.class})
public class MediaLinkConfig {

    public MediaLinkConfig(MediaProperties mediaProperties) {
        MediaLinkSupport.setBase(mediaProperties.getProxyBase());
    }
}
