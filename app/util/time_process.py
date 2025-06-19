from datetime import datetime

import re


def parse_datetime(datetime_str: str) -> datetime:
    # 尝试直接解析
    try:
        return datetime.fromisoformat(datetime_str)
    except ValueError:
        pass

    # 处理常见的变体格式
    patterns = [
        (r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})Z$", "%Y-%m-%dT%H:%M"),  # 2025-06-10T17:26Z
        (r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})Z$", "%Y-%m-%dT%H:%M:%S"),  # 2025-06-10T17:26:45Z
        (r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})$", "%Y-%m-%d %H:%M:%S"),  # 2025-06-10 17:26:45
    ]

    for pattern, fmt in patterns:
        match = re.match(pattern, datetime_str)
        if match:
            try:
                return datetime.strptime(match.group(1), fmt)
            except ValueError:
                continue

    # 处理带时区偏移的格式
    tz_pattern = r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?)([+-]\d{2}:\d{2})$"
    match = re.match(tz_pattern, datetime_str)
    if match:
        try:
            dt = datetime.fromisoformat(match.group(1) + match.group(2))
            return dt
        except ValueError:
            pass

    # 如果所有尝试都失败
    raise ValueError(f"Unsupported datetime format: {datetime_str}")