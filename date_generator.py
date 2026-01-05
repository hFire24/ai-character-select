import random
from datetime import datetime, timedelta

def generate_random_date(year=None):
    """Generate a random date between January 1 and December 31 of the given year."""
    if year is None:
        year = datetime.now().year
    
    start_date = datetime(year, 1, 1)
    end_date = datetime(year, 12, 31)
    
    days_between = (end_date - start_date).days
    random_days = random.randint(0, days_between)
    
    random_date = start_date + timedelta(days=random_days)
    return random_date

if __name__ == "__main__":
    random_date = generate_random_date()
    print(random_date.strftime("%B %d"))
