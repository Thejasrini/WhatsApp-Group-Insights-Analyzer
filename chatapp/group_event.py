import re
from datetime import datetime, timedelta


def _clean_member_name(name):
    if not name:
        return ''
    cleaned = name.replace('~', ' ')
    cleaned = cleaned.replace('\u202F', ' ').replace('\u00A0', ' ')
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def parse_timestamp(timestamp_str):
    timestamp_str = timestamp_str.replace('\u202F', ' ').replace('\u00A0', ' ')
    formats = [
        '%m/%d/%y, %I:%M %p',
        '%m/%d/%Y, %I:%M %p',
        '%m/%d/%y, %H:%M',
        '%m/%d/%Y, %H:%M',
        '%d/%m/%y, %I:%M %p',
        '%d/%m/%Y, %I:%M %p',
        '%d/%m/%y, %H:%M',
        '%d/%m/%Y, %H:%M',
        '%Y-%m-%d, %H:%M',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(timestamp_str, fmt)
        except ValueError:
            pass
    return None


def analyze_group_events(messages):
    events = {
        'added': [],
        'left': [],
        'removed': [],
        'changed_subject': [],
        'changed_icon': [],
        'created': []
    }

    for msg in messages:
        text = msg['message']
        timestamp = msg['timestamp']
        normalized_text = ' '.join(text.split())

        # Strict member added/joined system events only
        added_by_actor = re.search(r'^(.+?)\s+added\s+(.+?)(?:\s+to\s+the\s+group)?$', normalized_text, re.IGNORECASE)
        was_added = re.search(r'^(.+?)\s+was\s+added\s+to\s+the\s+group\.?$', normalized_text, re.IGNORECASE)
        joined_link = re.search(r'^(.+?)\s+joined\s+using\s+(?:a\s+)?group\s+link\.?$', normalized_text, re.IGNORECASE)
        joined_invite = re.search(r'^(.+?)\s+joined\s+using\s+this\s+group\'s\s+invite\s+link\.?$', normalized_text, re.IGNORECASE)

        if added_by_actor and len(normalized_text) <= 120:
            adder = _clean_member_name(added_by_actor.group(1))
            added_person = _clean_member_name(added_by_actor.group(2))
            events['added'].append({
                'timestamp': timestamp,
                'adder': adder or 'Unknown',
                'added_person': added_person or 'Unknown',
                'raw_message': text
            })
        elif was_added and len(normalized_text) <= 120:
            added_person = _clean_member_name(was_added.group(1))
            events['added'].append({
                'timestamp': timestamp,
                'adder': 'Unknown',
                'added_person': added_person or 'Unknown',
                'raw_message': text
            })
        elif joined_link and len(normalized_text) <= 140:
            added_person = _clean_member_name(joined_link.group(1))
            events['added'].append({
                'timestamp': timestamp,
                'adder': 'Invite link',
                'added_person': added_person or 'Unknown',
                'raw_message': text
            })
        elif joined_invite and len(normalized_text) <= 140:
            added_person = _clean_member_name(joined_invite.group(1))
            events['added'].append({
                'timestamp': timestamp,
                'adder': 'Invite link',
                'added_person': added_person or 'Unknown',
                'raw_message': text
            })

        # Left events
        elif re.search(r'left|exited', normalized_text, re.IGNORECASE):
            match = re.search(r'(.+?)\s+(?:left|exited)', normalized_text, re.IGNORECASE)
            if match:
                person_left = _clean_member_name(match.group(1))
                events['left'].append({
                    'timestamp': timestamp,
                    'person': person_left,
                    'raw_message': text
                })

        # Removed events
        elif re.search(r'removed|kicked', normalized_text, re.IGNORECASE):
            match = re.search(r'(.+?)\s+(?:removed|kicked)\s+(.+)', normalized_text, re.IGNORECASE)
            if match:
                remover = _clean_member_name(match.group(1))
                removed_person = _clean_member_name(match.group(2))
                events['removed'].append({
                    'timestamp': timestamp,
                    'remover': remover,
                    'removed_person': removed_person,
                    'raw_message': text
                })

        # Changed subject events
        elif 'changed the subject to' in normalized_text:
            match = re.search(r'(.+?)\s+changed the subject to\s*[\'"](.+?)[\'"]', normalized_text, re.IGNORECASE)
            if match:
                changer = _clean_member_name(match.group(1))
                new_subject = match.group(2).strip()
                events['changed_subject'].append({
                    'timestamp': timestamp,
                    'changer': changer,
                    'new_subject': new_subject,
                    'raw_message': text
                })

        # Changed icon events
        elif 'changed' in normalized_text and 'icon' in normalized_text:
            match = re.search(r'(.+?)\s+changed.*icon', normalized_text, re.IGNORECASE)
            if match:
                changer = _clean_member_name(match.group(1))
                events['changed_icon'].append({
                    'timestamp': timestamp,
                    'changer': changer,
                    'raw_message': text
                })

        # Created group events
        elif 'created' in normalized_text and 'group' in normalized_text:
            match = re.search(r'(.+?)\s+created.*group', normalized_text, re.IGNORECASE)
            if match:
                creator = _clean_member_name(match.group(1))
                events['created'].append({
                    'timestamp': timestamp,
                    'creator': creator,
                    'raw_message': text
                })

    return events


def get_event_counts(events):
    return {
        'added': len(events['added']),
        'left': len(events['left']),
        'removed': len(events['removed']),
        'changed_subject': len(events['changed_subject']),
        'changed_icon': len(events['changed_icon']),
        'created': len(events['created'])
    }


def get_event_details(events, event_type, start_date=None, end_date=None):
    event_list = events.get(event_type, [])
    if start_date or end_date:
        filtered_events = []
        for event in event_list:
            event_date = parse_timestamp(event['timestamp'])
            if event_date is None:
                continue
            if start_date and event_date < start_date:
                continue
            if end_date and event_date > end_date:
                continue
            filtered_events.append(event)
        return filtered_events
    return event_list


def get_top_removers(events, limit=5):
    remover_counts = {}
    for event in events['removed']:
        remover = event['remover']
        remover_counts[remover] = remover_counts.get(remover, 0) + 1

    sorted_removers = sorted(remover_counts.items(), key=lambda x: x[1], reverse=True)
    # Convert tuples to dictionaries for consistency
    return [{'name': name, 'count': count} for name, count in sorted_removers[:limit]]


# ------------------- New helpers for analytics dashboard -------------------

def _normalize_events(events):
    """Flatten to a standard schema for easier filtering/aggregation."""
    normalized = []
    def add_item(event_type, ts, actor, target, details):
        normalized.append({
            'event_type': event_type,
            'timestamp': ts,
            'actor': actor,
            'target': target,
            'details': details,
        })

    for e in events['added']:
        add_item('added', e['timestamp'], e['adder'], e.get('added_person'), e.get('raw_message'))
    for e in events['left']:
        add_item('left', e['timestamp'], e['person'], None, e.get('raw_message'))
    for e in events['removed']:
        add_item('removed', e['timestamp'], e['remover'], e.get('removed_person'), e.get('raw_message'))
    for e in events['changed_subject']:
        add_item('changed_subject', e['timestamp'], e['changer'], e.get('new_subject'), e.get('raw_message'))
    for e in events['changed_icon']:
        add_item('changed_icon', e['timestamp'], e['changer'], None, 'Icon changed')
    for e in events['created']:
        add_item('created', e['timestamp'], e['creator'], None, 'Group created')
    return normalized


def _filter_normalized(normalized, start_date=None, end_date=None, event_types=None, user=None):
    out = []
    types_set = set([t for t in (event_types or [])]) if event_types else None
    user_lower = user.lower() if user else None
    for row in normalized:
        dt = parse_timestamp(row['timestamp'])
        if dt is None:
            continue
        if start_date and dt < start_date:
            continue
        if end_date and dt > end_date:
            continue
        if types_set and row['event_type'] not in types_set:
            continue
        if user_lower and not (
            (row['actor'] and user_lower in row['actor'].lower()) or
            (row['target'] and user_lower in row['target'].lower())
        ):
            continue
        out.append({**row, 'dt': dt})
    return out


def compute_timeseries(normalized_rows):
    by_day = {}
    for r in normalized_rows:
        day = r['dt'].date().isoformat()
        d = by_day.setdefault(day, {'total': 0, 'added': 0, 'left': 0, 'removed': 0, 'changed_subject': 0, 'changed_icon': 0, 'created': 0})
        d['total'] += 1
        d[r['event_type']] += 1
    series = [
        {'date': day, **counts}
        for day, counts in by_day.items()
    ]
    series.sort(key=lambda x: x['date'])
    return series


def compute_distribution(normalized_rows):
    counts = {'added': 0, 'left': 0, 'removed': 0, 'changed_subject': 0, 'changed_icon': 0, 'created': 0}
    for r in normalized_rows:
        counts[r['event_type']] += 1
    total = sum(counts.values()) or 1
    percentages = {k: (v * 100.0) / total for k, v in counts.items()}
    return {'counts': counts, 'percentages': percentages, 'total': total}


def compute_most_active_day(timeseries):
    if not timeseries:
        return None
    return max(timeseries, key=lambda x: x['total'])


def compute_top_contributors(normalized_rows, limit=5):
    # Actor could be the person who left; treat them as contributor as well
    counts = {}
    for r in normalized_rows:
        actor = r['actor'] or 'Unknown'
        counts[actor] = counts.get(actor, 0) + 1
    ranked = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    return [{'name': k, 'count': v} for k, v in ranked[:limit]]


def extract_unique_actors(normalized_rows):
    actors = set()
    for r in normalized_rows:
        if r['actor']:
            actors.add(r['actor'])
        if r['target']:
            actors.add(r['target'])
    return sorted(actors)