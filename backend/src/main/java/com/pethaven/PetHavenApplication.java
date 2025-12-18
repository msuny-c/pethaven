package com.pethaven;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PetHavenApplication {

    public static void main(String[] args) {
        SpringApplication.run(PetHavenApplication.class, args);
    }
}
