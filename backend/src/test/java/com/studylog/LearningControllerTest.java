package com.studylog;

import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LearningControllerTest {
    @Test void streakAllowsReturningBeforeTodaysLesson() {
        LocalDate today = LocalDate.of(2026, 10, 20);
        assertThat(LearningController.streak(Set.of(today.minusDays(1), today.minusDays(2)), today)).isEqualTo(2);
        assertThat(LearningController.streak(Set.of(today, today.minusDays(1)), today)).isEqualTo(2);
        assertThat(LearningController.streak(Set.of(today.minusDays(2)), today)).isZero();
    }
    @Test void wrongAnswersCannotCreateCompletion() {
        JdbcTemplate db = mock(JdbcTemplate.class);
        LearningController controller = new LearningController(db);
        assertThatThrownBy(() -> controller.complete("cafe-1", new LearningController.Submission(List.of(0, 2))))
            .isInstanceOf(ResponseStatusException.class);
        verifyNoInteractions(db);
    }
    @Test void lessonDoesNotExposeAnswerKey() {
        assertThat(new LearningController(mock(JdbcTemplate.class)).lesson().questions()).hasSize(2);
    }
}
