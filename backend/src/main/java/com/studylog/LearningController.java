package com.studylog;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class LearningController {
    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");
    private final JdbcTemplate db;
    public LearningController(JdbcTemplate db) { this.db = db; }
    public record Question(String prompt, List<String> options) {}
    public record Lesson(String id, String title, String subtitle, String dialogue, String phrase,
                         String translation, List<Question> questions) {}
    private static final Lesson LESSON = new Lesson("cafe-1", "카페에서 주문하기", "작은 한 문장으로 시작하는 오늘의 영어",
        "Barista: Hi! What can I get for you?\nYou: I'd like a latte, please.\nBarista: For here or to go?\nYou: To go, please.",
        "I'd like a latte, please.", "라테 한 잔 주세요.", List.of(
            new Question("무엇을 주문했나요?", List.of("차", "라테", "샌드위치")),
            new Question("‘포장해 주세요’에 맞는 표현은?", List.of("For here, please.", "Nice to meet you.", "To go, please."))));
    public record Submission(@NotNull List<Integer> answers) {}
    @GetMapping("/lesson") public Lesson lesson() { return LESSON; }
    @PostMapping("/lessons/{id}/complete")
    public Map<String, Object> complete(@PathVariable String id, @Valid @RequestBody Submission submission) {
        if (!LESSON.id().equals(id)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "학습을 찾을 수 없습니다.");
        if (!List.of(1, 2).equals(submission.answers()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "답을 다시 확인해 주세요.");
        db.update("INSERT INTO learning_day(learned_on, lesson_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE lesson_id = VALUES(lesson_id)", LocalDate.now(ZONE), id);
        return Map.of("completed", true, "message", "오늘도 한 걸음! 내일 다시 만나요.");
    }
    @GetMapping("/progress") public Map<String, Object> progress() {
        LocalDate today = LocalDate.now(ZONE);
        Set<LocalDate> days = new HashSet<>(db.query("SELECT learned_on FROM learning_day", (rs, n) -> rs.getDate(1).toLocalDate()));
        return Map.of("todayCompleted", days.contains(today), "streak", streak(days, today),
            "totalDays", days.size(), "week", java.util.stream.IntStream.rangeClosed(0, 6)
            .mapToObj(i -> { LocalDate day = today.minusDays(6-i); return Map.of("date", day.toString(), "completed", days.contains(day)); }).toList());
    }
    static int streak(Set<LocalDate> days, LocalDate today) {
        LocalDate cursor = days.contains(today) ? today : today.minusDays(1);
        int count = 0;
        while (days.contains(cursor)) { count++; cursor = cursor.minusDays(1); }
        return count;
    }
}
