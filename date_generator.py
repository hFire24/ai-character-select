import random
import sys
from datetime import datetime, timedelta

def parse_month_day(value):
    """Parse a month name and day, allowing February 29."""
    for date_format in ("%B %d %Y", "%b %d %Y"):
        try:
            return datetime.strptime(f"{value.strip()} 2000", date_format)
        except ValueError:
            pass
    raise ValueError("Enter a valid month and day, such as December 3 or Jan 25.")


def generate_random_date(year=None, end_date=None, today=None):
    """Pick an inclusive date in a year, or from today to the next month/day."""
    current_date = today if today is not None else datetime.now()
    if end_date:
        month_day = parse_month_day(end_date)
        start_date = datetime(current_date.year, current_date.month, current_date.day)
        end_year = start_date.year
        while True:
            try:
                range_end = datetime(end_year, month_day.month, month_day.day)
            except ValueError:  # February 29 needs the next leap year.
                end_year += 1
                continue
            if range_end >= start_date:
                break
            end_year += 1
    else:
        if year is None:
            year = current_date.year
        start_date = datetime(year, 1, 1)
        range_end = datetime(year, 12, 31)
    
    days_between = (range_end - start_date).days
    random_days = random.randint(0, days_between)
    
    random_date = start_date + timedelta(days=random_days)
    return random_date

if __name__ == "__main__":
    end_date = " ".join(sys.argv[1:]).strip()
    try:
        random_date = generate_random_date(end_date=end_date)
    except ValueError as error:
        print(error, file=sys.stderr)
        sys.exit(1)
    print(f"{random_date.strftime('%B')} {random_date.day}")
