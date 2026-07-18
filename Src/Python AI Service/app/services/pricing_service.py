from datetime import date
from decimal import Decimal, ROUND_HALF_UP


class PricingSuggestionService:
    WEEKEND_RATE = Decimal("0.10")
    HOLIDAY_RATE = Decimal("0.30")
    LOW_VACANCY_RATE = Decimal("0.10")
    LOW_VACANCY_THRESHOLD = 0.2

    VIETNAM_HOLIDAYS_2026 = {
        date(2026, 1, 1),
        date(2026, 2, 14),
        date(2026, 2, 15),
        date(2026, 2, 16),
        date(2026, 2, 17),
        date(2026, 2, 18),
        date(2026, 2, 19),
        date(2026, 2, 20),
        date(2026, 2, 21),
        date(2026, 2, 22),
        date(2026, 4, 26),
        date(2026, 4, 27),
        date(2026, 4, 30),
        date(2026, 5, 1),
        date(2026, 5, 2),
        date(2026, 5, 3),
        date(2026, 8, 29),
        date(2026, 8, 30),
        date(2026, 8, 31),
        date(2026, 9, 1),
        date(2026, 9, 2),
    }

    def suggest_price(self, base_price: float, target_date: date, vacant_rate: float) -> dict:
        is_weekend = target_date.weekday() >= 5
        is_holiday = target_date in self.VIETNAM_HOLIDAYS_2026
        is_low_vacancy = vacant_rate < self.LOW_VACANCY_THRESHOLD

        rate = Decimal("0")
        applied_rules: list[str] = []

        if is_weekend:
            rate += self.WEEKEND_RATE
            applied_rules.append("weekend_10_percent")

        if is_holiday:
            rate += self.HOLIDAY_RATE
            applied_rules.append("vietnam_holiday_30_percent")

        if is_low_vacancy:
            rate += self.LOW_VACANCY_RATE
            applied_rules.append("low_vacancy_10_percent")

        multiplier = Decimal("1") + rate
        price = Decimal(str(base_price)) * multiplier
        suggested_price = int(price.quantize(Decimal("1"), rounding=ROUND_HALF_UP))

        return {
            "suggested_price": suggested_price,
            "formatted_suggested_price": f"{suggested_price:,} \u0111",
            "multiplier": float(multiplier),
            "applied_rules": applied_rules,
            "is_weekend": is_weekend,
            "is_holiday": is_holiday,
            "is_low_vacancy": is_low_vacancy,
        }
