package com.pethaven.config;

import com.pethaven.security.JwtAuthFilter;
import com.pethaven.model.enums.SystemRole;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(registry -> registry
                        .requestMatchers("/api/v1/auth/**", "/api/v1/openapi/**", "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/media/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/animals/**").permitAll()
                        // Кандидаты подают заявки
                        .requestMatchers(HttpMethod.POST, "/api/v1/adoptions/applications").hasRole(SystemRole.candidate.name().toUpperCase())
                        // Координатор управляет заявками/интервью/договором, кандидаты могут смотреть свои заявки
                        .requestMatchers(HttpMethod.GET, "/api/v1/adoptions/applications/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase(), SystemRole.candidate.name().toUpperCase())
                        // Слоты интервью: создание/отмена координатор/админ, просмотр кандидаты, бронь кандидат
                        .requestMatchers(HttpMethod.GET, "/api/v1/adoptions/slots/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase(), SystemRole.candidate.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/adoptions/slots/book").hasRole(SystemRole.candidate.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/adoptions/slots/cancel").hasAnyRole(SystemRole.candidate.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/adoptions/slots/reschedule").hasAnyRole(SystemRole.candidate.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/adoptions/interviews/*/confirm").hasRole(SystemRole.candidate.name().toUpperCase())
                        .requestMatchers("/api/v1/adoptions/slots/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers("/api/v1/adoptions/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        // Ветеринар управляет медкартами и может обновлять животных
                        .requestMatchers("/api/v1/medical/**").hasAnyRole(SystemRole.veterinar.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        // Животные: создание/редактирование/удаление доступно админу и координатору, просмотр всем
                        .requestMatchers(HttpMethod.POST, "/api/v1/animals/**").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase())
                        .requestMatchers(HttpMethod.PUT, "/api/v1/animals/**").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase())
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/animals/*/status").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase(), SystemRole.veterinar.name().toUpperCase())
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/animals/**").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase())
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/animals/**").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase())
                        // Смены: волонтеры могут просматривать/писаться, координатор создавать/назначать задачи
                        .requestMatchers(HttpMethod.GET, "/api/v1/shifts/**").hasAnyRole(SystemRole.volunteer.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/shifts/signup").hasRole(SystemRole.volunteer.name().toUpperCase())
                        .requestMatchers("/api/v1/shifts/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        // Задачи видят волонтеры, редактируют координатор/админ
                        .requestMatchers(HttpMethod.GET, "/api/v1/tasks/**").hasAnyRole(SystemRole.volunteer.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers("/api/v1/tasks/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        // Пользователи: просмотр администраторам и координаторам, изменения только администратору, кроме загрузки аватара самим пользователем
                        .requestMatchers(HttpMethod.GET, "/api/v1/users/**").hasAnyRole(SystemRole.admin.name().toUpperCase(), SystemRole.coordinator.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/users/avatar").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/users/me/profile").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/users/me").authenticated()
                        .requestMatchers("/api/v1/users/**").hasRole(SystemRole.admin.name().toUpperCase())
                        // Отчеты постадопции
                        .requestMatchers(HttpMethod.GET, "/api/v1/reports").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.volunteer.name().toUpperCase(), SystemRole.admin.name().toUpperCase(), SystemRole.candidate.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/reports/*/submit").hasRole(SystemRole.candidate.name().toUpperCase())
                        .requestMatchers(HttpMethod.POST, "/api/v1/reports/*/media").hasRole(SystemRole.candidate.name().toUpperCase())
                        .requestMatchers(HttpMethod.GET, "/api/v1/reports/*/media").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.volunteer.name().toUpperCase(), SystemRole.admin.name().toUpperCase(), SystemRole.candidate.name().toUpperCase())
                        .requestMatchers("/api/v1/reports/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.volunteer.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        // Уведомления — только авторизованные пользователи для своих данных
                        .requestMatchers("/api/v1/notifications/**").authenticated()
                        // Общедоступные статики
                        .requestMatchers("/uploads/**").permitAll()
                        // Волонтерская ориентация
                        .requestMatchers(HttpMethod.POST, "/api/v1/volunteers/applications").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/v1/volunteers/applications/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/volunteers/applications/decision").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .requestMatchers("/api/v1/volunteers/**").hasAnyRole(SystemRole.coordinator.name().toUpperCase(), SystemRole.admin.name().toUpperCase())
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
